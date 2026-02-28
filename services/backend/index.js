import {Server} from "socket.io";
import jwt from "jsonwebtoken";
import { GameManager } from "./gameservice/Logic/GameManager.js";

const gameManager = new GameManager();
const io = new Server(8003, { cors: { origin: "*"}});
const games = new Map();
const SECRET_KEY = process.env.JWT_SECRET;

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

    socket.on("join-game", (gameId) => {
        if(!gameManager.games.has(gameId)) {
            gameManager.createGame(gameId, socket.id, socket.id);
            // Note: Plus tard, tu mettras player1 = socket_du_gars_1, player2 = socket_du_gars_2
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
    });
})