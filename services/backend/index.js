import {Server} from "socket.io";
import jwt from "jsonwebtoken";
import {GameManager} from "./gameservice/Logic/GameManager.js";
import {AIGameManager} from "./gameservice/Logic/AIGameManager.js";

const pvpManager = new GameManager();
const aiManager = new AIGameManager();
const io = new Server(8003, {cors: {origin: "*"}});
const SECRET_KEY = process.env.JWT_SECRET;
const waitingQueue = [];
const connectedUsers = new Map();

const GAME_MODE = {
    PVP: "PVP",
    AI: "AI"
};

const HUMAN_TURN_ANIMATION_DELAY_MS = 1200;
const AI_TURN_ANIMATION_DELAY_MS = 650;

// gameId -> GAME_MODE.PVP | GAME_MODE.AI
const gameModes = new Map();

function getManagerByMode(mode) {
    return mode === GAME_MODE.AI ? aiManager : pvpManager;
}

function getManagerForGame(gameId) {
    const mode = gameModes.get(gameId);
    if (mode) {
        return {manager: getManagerByMode(mode), mode};
    }

    // Fallback défensif pour parties existantes sans mode enregistré.
    if (pvpManager.games.has(gameId)) return {manager: pvpManager, mode: GAME_MODE.PVP};
    if (aiManager.games.has(gameId)) return {manager: aiManager, mode: GAME_MODE.AI};
    return {manager: null, mode: null};
}

function finishTrackedGame(gameId) {
    const {manager} = getManagerForGame(gameId);
    if (!manager) return;
    manager.finishGame(gameId);
    gameModes.delete(gameId);
}

function finalizeProcessingTurn(game) {
    if (!game?.engine) return null;
    game.engine.isProcessingTurn = false;
    game.engine.lastLaserResult = null;
    return game.engine.getState();
}

function finalizeAndEmit(gameId, manager) {
    const game = manager.games.get(gameId);
    if (!game) return null;
    const state = finalizeProcessingTurn(game);
    if (state) {
        io.to(gameId).emit("game-update", state);
    }
    return state;
}

async function maybePlayAiTurn(gameId) {
    const {manager, mode} = getManagerForGame(gameId);
    if (mode !== GAME_MODE.AI || manager !== aiManager) return;

    const game = aiManager.games.get(gameId);
    if (!game || !game.ai || game.engine.winner || game.engine.turn !== 2) return;

    const aiResult = await aiManager.playAiTurn(gameId);
    if (!aiResult) {
        io.to(gameId).emit("game-closed", "Erreur: l'IA n'est pas capable de jouer sur cette partie.");
        finishTrackedGame(gameId);
        return;
    }
    if (aiResult.error) {
        io.to(gameId).emit("game-closed", aiResult.error);
        finishTrackedGame(gameId);
        return;
    }

    if (aiResult.isProcessingTurn) {
        // Important: on émet d'abord l'état de tir IA pour que le front puisse rendre le laser.
        io.to(gameId).emit("game-update", aiResult);
        setTimeout(() => {
            finalizeAndEmit(gameId, aiManager);
        }, AI_TURN_ANIMATION_DELAY_MS);
        return;
    }

    io.to(gameId).emit("game-update", aiResult);
}

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        socket.isAuthenticated = false;
        socket.username = `Guest_${socket.id.slice(0, 6)}`;
        socket.rank = "N/A";
        socket.elo = 0;
        return next();
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        socket.isAuthenticated = true;
        socket.username = decoded.username;
        socket.rank = decoded.rank;
        socket.elo = decoded.elo;
        next();
    } catch (err) {
        console.log("Invalid token, fallback en invité:", err.message);
        socket.isAuthenticated = false;
        socket.username = `Guest_${socket.id.slice(0, 6)}`;
        socket.rank = "N/A";
        socket.elo = 0;
        next();
    }
});



io.on("connection", (socket) => {
    console.log(`Joueur authentifié connecté : ${socket.username} (id:${socket.id})`);
    connectedUsers.set(socket.username, socket.id);

    socket.on("SEND_FRIEND_REQ", (data) => {
        const targetSocketId = connectedUsers.get(data.to);
        if(targetSocketId){
            io.to(targetSocketId).emit('NEW_FRIEND_REQ', {
                from: socket.username,
                message: `Nouvelle demande d'ami de ${socket.username} !`
            });
        }
    });

    socket.on("find-game", () => {
        if (!socket.isAuthenticated) {
            socket.emit("game-closed", "Connecte-toi pour jouer en 1v1 en ligne.");
            return;
        }

        console.log(`${socket.username} is looking for a game`);

        const existingIndex = waitingQueue.findIndex(s => s.username === socket.username);
        if (existingIndex !== -1) {
            waitingQueue[existingIndex] = socket;
        } else {
            waitingQueue.push(socket);
        }

        if (waitingQueue.length >= 2) {
            const player1 = waitingQueue[0];

            const opponentIndex = waitingQueue.findIndex(s => s.username !== player1.username);

            if (opponentIndex !== -1) {
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
                };

                pvpManager.createGame(matchInfo.gameId, player1.id, player2.id);
                gameModes.set(matchInfo.gameId, GAME_MODE.PVP);
                player1.emit("match-found", matchInfo);
                player2.emit("match-found", matchInfo);
            }
        } else {
            socket.emit("waiting-for-opponent");
        }
    });

    socket.on("launch-game", async () => {
        console.log(`${socket.username} is looking for a game`);
        const matchId = "game_" + Math.random().toString(36).substr(2, 10);
        const matchInfo = {
            gameId: matchId,
            player1: {
                username: socket.username,
                elo: socket.elo,
                rank: socket.rank
            },
            player2: {
                username: "Bot",
                elo: 0,
                rank: "N/A"
            }
        };

        try {
            await aiManager.createGame(matchInfo.gameId, socket.id, null);
            gameModes.set(matchInfo.gameId, GAME_MODE.AI);
            socket.join(matchInfo.gameId);
            socket.emit("match-found", matchInfo);

            const game = aiManager.games.get(matchInfo.gameId);
            if (game) {
                socket.emit("init-state", game.engine.getState());
            }
        } catch (error) {
            console.error("Erreur création partie IA:", error);
            socket.emit("game-closed", "Impossible de lancer une partie contre l'IA pour le moment.");
        }
    });

    socket.on("join-game", (gameId) => {
        const {manager} = getManagerForGame(gameId);
        if (!manager) {
            socket.emit("game-closed", "Cette partie n'existe pas.");
            return;
        }

        socket.join(gameId);
        const game = manager.games.get(gameId);
        socket.emit("init-state", game.engine.getState());
    });

    socket.on("player-action", async (data) => {
        const {manager, mode} = getManagerForGame(data.gameId);
        if (!manager) {
            socket.emit("game-closed", "Cette partie n'existe pas.");
            return;
        }

        const result = await manager.handleAction(data.gameId, socket.id, data);
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
            setTimeout(async () => {
                finalizeAndEmit(data.gameId, manager);
                if (mode === GAME_MODE.AI) {
                    await maybePlayAiTurn(data.gameId);
                }
            }, HUMAN_TURN_ANIMATION_DELAY_MS);
            return;
        }

        if (mode === GAME_MODE.AI) {
            await maybePlayAiTurn(data.gameId);
        }
    });

    socket.on("revenge", async (gameId) => {
        const {manager} = getManagerForGame(gameId);
        if (!manager) {
            socket.emit("game-closed");
            return;
        }

        const result = await manager.revenge(gameId);

        if (result == null) {
            socket.emit("game-closed");
        } else {
            io.to(gameId).emit("game-update", result);
        }
    });

    socket.on("leave-game", (gameId) => {
        finishTrackedGame(gameId);
        console.log("Revanche non demandée. Partie nettoyée de la mémoire.");
    });

    socket.on("disconnect", () => {
        console.log(`Joueur déconnecté : ${socket.username}`);
        connectedUsers.delete(socket.username);

        const index = waitingQueue.findIndex(s => s.id === socket.id);
        if (index !== -1) waitingQueue.splice(index, 1);

        const managersByMode = [
            [GAME_MODE.PVP, pvpManager],
            [GAME_MODE.AI, aiManager]
        ];

        for (const [mode, manager] of managersByMode) {
            for (const [gameId, game] of manager.games.entries()) {
                if (game.p1_id === socket.id || game.p2_id === socket.id) {
                    io.to(gameId).emit("game-closed", "Ton adversaire a quitté la partie. Tu as gagné par forfait !");
                    manager.games.delete(gameId);
                    gameModes.delete(gameId);
                    console.log(`Partie ${gameId} fermée suite à une déconnexion (${mode}).`);
                    return;
                }
            }
        }
    });
});