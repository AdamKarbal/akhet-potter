import {Server} from "socket.io";
import jwt from "jsonwebtoken";
import { GameManager } from "./gameservice/Logic/GameManager.js";

const ELO_KEY = process.env.ELO_KEY;
const io = new Server(8003, { cors: { origin: "*"}});
const gameManager = new GameManager(io);
const SECRET_KEY = process.env.JWT_SECRET;
const waitingQueue = [];
const connectedUsers = new Map();

io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if(!token) {
        console.log("No token found. Acces denied");
        return next(new Error("No token found."));
    }

    try{
        const decoded = jwt.verify(token, SECRET_KEY);
        socket.data.username = decoded.username;
        socket.data.rank = decoded.rank;
        socket.data.elo = decoded.elo;
        next();
    }
    catch(err){
        console.log(err);
        next(new Error("Invalid token"));
    }
});



io.on("connection", (socket) => {
    console.log(`Joueur authentifié connecté : ${socket.data.username} (id:${socket.id})`);
    connectedUsers.set(socket.data.username, socket.id);

    socket.on("invite-friendly", (data) => {
        const targetUsername = data.to;
        const targetSocketId = connectedUsers.get(targetUsername);
        if(targetSocketId){
            io.to(targetSocketId).emit("NEW_FRIENDLY_MATCH", {
                from: socket.data.username,
                message: `Nouvelle demande de match amical de ${socket.data.username} !`
            });

            setTimeout(() => {
                if(!gameManager.isMatchExisting(socket.data.username, targetUsername)){
                    socket.emit("invitation-timeout");
                }
            }, 60000);
        }
        else{
            socket.emit("user-not-online", {username : targetUsername, message: `${targetUsername} n'est pas en ligne actuellement.'}`});
            console.log(`Erreur lors de l'invitation en match amical : ${targetUsername} n'est pas en ligne.}`);
        }
    });

    socket.on("SEND_FRIEND_REQ", (data) => {
        const targetSocketId = connectedUsers.get(data.to);
        if(targetSocketId){
            io.to(targetSocketId).emit('NEW_FRIEND_REQ', {
                from: socket.data.username,
                message: `Nouvelle demande d'ami de ${socket.data.username} !`
            });
        }
    });

    //debug
    socket.on("quit", () => {
        for (const [gameId, game] of gameManager.games.entries()) {
            if (game.p1_id === socket.id || game.p2_id === socket.id) {
                gameManager.finishGame(gameId);
                break;
            }
        }
    });

    socket.on("queue-out", () => {
        const index = waitingQueue.findIndex(s => s.data.username === socket.data.username);
        if(index === -1) {
            return;
        }
        else{
            console.log(`${socket.data.username} est sortie de la file d'attente.`);
            waitingQueue.splice(index, 1);
        }
    })

    socket.on("find-game", ()=> {
        console.log(`${socket.data.username} is looking for a game`);

        const existingIndex = waitingQueue.findIndex(s => s.data.username === socket.data.username);
        if(existingIndex !== -1) {
            waitingQueue[existingIndex] = socket;
        }
        else{
            waitingQueue.push(socket);
        }

        if(waitingQueue.length >= 2){
            const player1 = waitingQueue[0];

            const opponentIndex = waitingQueue.findIndex(s => s.data.username !== player1.data.username);

            if(opponentIndex !== -1){
                const player2 = waitingQueue[opponentIndex];
                waitingQueue.splice(opponentIndex, 1);
                waitingQueue.shift();

                const matchId = "game_" + Math.random().toString(36).substr(2, 10);

                const matchInfo = {
                    gameId: matchId,
                    isFriendly: false,
                    player1: {
                        username: player1.data.username,
                        elo: player1.data.elo,
                        rank: player1.data.rank
                    },
                    player2: {
                        username: player2.data.username,
                        elo: player2.data.elo,
                        rank: player2.data.rank
                    }
                }

                gameManager.createGame(matchInfo.gameId, player1, player2, matchInfo.isFriendly);
                player1.emit("match-found", matchInfo);
                player2.emit("match-found", matchInfo);
            }
        }
        else{
            socket.emit("waiting-for-opponent");
        }
    })

    socket.on("join-game", (gameId) => {
        if(!gameManager.games.has(gameId)) {
            socket.emit("game-closed", "Cette partie n'existe pas.");
            return;
        }

        socket.join(gameId);
        const game = gameManager.games.get(gameId);
        socket.emit("init-state", game.engine.getState());
    });



    socket.on("join-friendly", (data) => {
        const me = socket;
        const senderSocketId = connectedUsers.get(data.from);

        if (gameManager.isMatchExisting(socket.data.username, data.from)) {
            return;
        }

        if (!senderSocketId) {
            socket.emit("invitation-expired", {message: "Joueur déconnecté."});
            return;
        }

        if(gameManager.isPlayerInGame(data.from)){
            socket.emit("invitation-expired", {message: "Joueur déjà en partie."});
            return;
        }

        const senderSocket = io.sockets.sockets.get(senderSocketId);

        if(!senderSocket) return;

        const matchId = "game_" + Math.random().toString(36).substr(2, 10);

        const matchInfo = {
            gameId: matchId,
            isFriendly: true,
            player1: {
                username: me.data.username,
                elo: me.data.elo,
                rank: me.data.rank
            },
            player2: {
                username: senderSocket.data.username,
                elo: senderSocket.data.elo,
                rank: senderSocket.data.rank
            }
        }

        me.join(matchId);
        senderSocket.join(matchId);

        gameManager.createGame(matchInfo.gameId, me, senderSocket, matchInfo.isFriendly);

        me.emit("friendly-match-found", matchInfo);
        senderSocket.emit("friendly-match-found", matchInfo);
    });

    socket.on("player-action", (data) => {
        const result = gameManager.handleAction(data.gameId, socket.id, data);

        if (!result) {
            console.log("Erreur : Impossible de traiter l'action pour la partie", data.gameId);
            return;
        }

        if (result.error) {
            console.log("Action refusée :", result.error);
            return;
        }

        io.to(data.gameId).emit("game-update", result);

        if (result.isProcessingTurn) {
            setTimeout(() => {
                const game = gameManager.games.get(data.gameId);
                if (game) {
                    game.engine.isProcessingTurn = false;
                    game.engine.lastLaserResult = null;
                    io.to(data.gameId).emit("game-update", game.engine.getState());
                }
            }, 1200);
        }

        if(result.winner){
            io.to(data.gameId).emit("game-over", result);
            const game = gameManager.games.get(data.gameId);
            // result.winner vaut 1 (PLAYER.P1) ou 2 (PLAYER.P2)
            const winnerUsername = result.winner === 1 ? game.p1_username : game.p2_username;
            const looserUsername = result.winner === 1 ? game.p2_username : game.p1_username;
            if(!data.isFriendly) eloUpdate(data.gameId, winnerUsername, looserUsername);
        }
    });

    socket.on("revenge", (gameId) => {
        const result = gameManager.revenge(gameId);

        if(result == null){
            socket.emit("game-closed");
        }
        if(result === "1") return;
        else{
            io.to(gameId).emit("revenge-granted", result);
            io.to(gameId).emit("init-state", result);
        }

    });

    socket.on("leave-game", (gameId) => {
        gameManager.finishGame(gameId);
        io.to(gameId).emit("back-to-homepage");
        console.log(`Revanche non demandée. Partie d'id : [${gameId}] nettoyée de la mémoire.`);
    })

    socket.on("disconnect", () => {
        console.log(`Joueur déconnecté : ${socket.data.username}`);
        connectedUsers.delete(socket.data.username);

        const index = waitingQueue.findIndex(s => s.id === socket.id);
        if (index !== -1) waitingQueue.splice(index, 1);

        for (const [gameId, game] of gameManager.games.entries()) {
            if (game.p1_id === socket.id || game.p2_id === socket.id) {
                const winnerUsername = (game.p1_id === socket.id) ? game.p2_username : game.p1_username;
                const looserUsername = (game.p1_id === socket.id) ? game.p1_username : game.p2_username;
                io.to(gameId).emit("game-closed", "Ton adversaire a quitté la partie. Tu as gagné par forfait !");
                if(!game.isFriendly) eloUpdate(gameId, winnerUsername, looserUsername);
                gameManager.games.delete(gameId);
                break;
            }
        }
    });
});

async function eloUpdate(gameId, winnerUsername, looserUsername) {
    try {
        const response = await fetch("http://auth:8002/api/update-elo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-secret-key": `${ELO_KEY}`
            },
            body: JSON.stringify({winner: winnerUsername, looser: looserUsername})
        });

        if (!response.ok) {
            console.error(`Erreur lors de la mise à jour de l'élo des joueurs via AuthService: ${await response.text()}`);
            return;
        }

        const eloResult = await response.json();
        io.to(gameId).emit("elo-updated", eloResult);
    }
    catch (error){
        console.error("Erreur de communication avec le service d'elo :", error);
    }
}