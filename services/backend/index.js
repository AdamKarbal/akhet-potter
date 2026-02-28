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

        const isAlreadyWaiting = waitingQueue.find(s => s.id === socket.id);
        if (!isAlreadyWaiting) {
            waitingQueue.push(socket);
        }

        if(waitingQueue.length >= 2){
            const player1 = waitingQueue.shift();
            const player2 = waitingQueue.shift();

            const matchId = "game_" + Math.random().toString(36).substr(2, 10);

            gameManager.createGame(matchId, player1.id, player2.id);
            player1.emit("match-found", matchId);
            player2.emit("match-found", matchId);
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
        if (result && result.error) {
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
    });
})