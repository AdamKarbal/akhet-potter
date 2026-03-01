import {Server} from "socket.io";
import jwt from "jsonwebtoken";
import { GameManager } from "./gameservice/Logic/GameManager.js";

const gameManager = new GameManager();
const io = new Server(8003, { cors: { origin: "*"}});
const games = new Map();
const SECRET_KEY = process.env.JWT_SECRET;
const waitingQueue = [];

io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if(!token) {
        console.log("No token found. Acces denied");
        return next(new Error("No token found."));
    }

    try{
        const decoded = jwt.verify(token, SECRET_KEY);
        socket.username = decoded.username;
        socket.rank = decoded.rank;
        socket.elo = decoded.elo;
        next();
    }
    catch(err){
        console.log(err);
        next(new Error("Invalid token"));
    }
});



io.on("connection", (socket) => {
    console.log(`Joueur authentifié connecté : ${socket.username} (id:${socket.id})`);

    socket.on("find-game", ()=> {
        console.log(`${socket.username} is looking for a game`);

        const existingIndex = waitingQueue.findIndex(s => s.username === socket.username);
        if(existingIndex !== -1) {
            waitingQueue[existingIndex] = socket;
        }
        else{
            waitingQueue.push(socket);
        }

        if(waitingQueue.length >= 2){
            const player1 = waitingQueue[0];

            const opponentIndex = waitingQueue.findIndex(s => s.username !== player1.username);

            if(opponentIndex !== -1){
                const player2 = waitingQueue[opponentIndex];
                waitingQueue.splice(opponentIndex, 1);
                waitingQueue.shift();

                const matchId = "game_" + Math.random().toString(36).substr(2, 10);

                const matchInfo = {
                    gameId: matchId,
                    player1: {
                        username: player1.username,
                        elo: player1.elo,
                        rank: player1.rank
                    },
                    player2: {
                        username: player2.username,
                        elo: player2.elo,
                        rank: player2.rank
                    }
                }

                gameManager.createGame(matchInfo.gameId, player1.id, player2.id);
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
    });

    socket.on("revenge", (gameId) => {
        const result = gameManager.revenge(gameId);

        if(result == null){
            socket.emit("game-closed");
        }
        else if (result) {
            io.to(gameId).emit("game-update", result);
        }
    });

    socket.on("leave-game", (gameId) => {
        gameManager.finishGame(gameId);
        console.log("Revanche non demandée. Partie nettoyée de la mémoire.");
    })

    socket.on("disconnect", () => {
        console.log(`Joueur déconnecté : ${socket.username}`);
        const index = waitingQueue.findIndex(s => s.id === socket.id);
        if (index !== -1) waitingQueue.splice(index, 1);

        for (const [gameId, game] of gameManager.games.entries()) {
            if (game.p1 === socket.id || game.p2 === socket.id) {
                const winnerId = (game.p1 === socket.id) ? game.p2 : game.p1;
                io.to(gameId).emit("game-closed", "Ton adversaire a quitté la partie. Tu as gagné par forfait !");
                gameManager.games.delete(gameId);
                break;
            }
        }
    });
});