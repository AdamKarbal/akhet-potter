import {Server} from "socket.io";
import jwt from "jsonwebtoken";
import {AIGameManager} from "./gameservice/Logic/AIGameManager.js";
import {GameManager} from "./gameservice/Logic/GameManager.js";
import {PLAYER} from "./gameservice/Model/model.js";
import { unlockAchievement } from "./utils.js";

const ELO_KEY = process.env.ELO_KEY;
const io = new Server(8003, { cors: { origin: "*"}});
const pvpManager = new GameManager(io);
const aiManager = new AIGameManager();
const SECRET_KEY = process.env.JWT_SECRET;
const waitingQueue = [];
const connectedUsers = new Map();

const GAME_MODE = {
    PVP: "PVP",
    AI: "AI"
};

const HUMAN_TURN_ANIMATION_DELAY_MS = 1200;
const AI_TURN_ANIMATION_DELAY_MS = 650;
// Temps (ms) durant lequel un joueur déconnecté peut se reconnecter avant forfait
const HUMAN_RECONNECT_TIMEOUT_MS = 30_000;

// gameId -> GAME_MODE.PVP | GAME_MODE.AI
const gameModes = new Map();
// clé: `${gameId}_${username}` -> { timeoutId, originalSocketId }
const reconnectionTimers = new Map();
// debug toggle pour reconnexions
const RECON_DEBUG = true;

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

// Retourne l'état du moteur en s'assurant que remainingTurnMs reflète
// la véritable durée restante (qu'un timer soit actif ou stoppé).
function engineStateWithRemaining(engine) {
    if (!engine) return null;
    const state = engine.getState();
    try {
        let rem = null;
        if (engine.turnTimerStartedAt && engine.turnTimerDuration) {
            const elapsed = Date.now() - engine.turnTimerStartedAt;
            rem = Math.max(0, engine.turnTimerDuration - elapsed);
        } else if (typeof engine.remainingTurnMs === 'number') {
            rem = engine.remainingTurnMs;
        }
        state.remainingTurnMs = typeof rem === 'number' ? rem : null;
    } catch (e) {
        console.error('Erreur lors du calcul remainingTurnMs:', e);
        state.remainingTurnMs = state.remainingTurnMs ?? null;
    }
    return state;
}

function finishTrackedGame(gameId) {
    const {manager} = getManagerForGame(gameId);
    if (!manager) return;
    const game = manager.games.get(gameId);
    if (game) game.engine.stopTurnTimer();
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

        if (state.winner) io.to(gameId).emit("game-over", state);

        if (!game.engine.winner) {
            game.engine.startTurnTimer();
        }
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

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        socket.data.username = decoded.username;
        socket.data.rank = decoded.rank;
        socket.data.elo = decoded.elo;
        socket.isAuthenticated = true;
        next();
    } catch (err) {
        console.log("Invalid token, fallback en invité:", err.message);
        socket.isAuthenticated = false;
        // Toujours initialiser socket.data pour éviter des undefined plus loin
        socket.data = socket.data || {};
        socket.data.username = `Guest_${socket.id.slice(0, 6)}`;
        socket.data.rank = "N/A";
        socket.data.elo = 0;
        next();
    }
});



io.on("connection", (socket) => {
    console.log(`Joueur authentifié connecté : ${socket.data.username} (id:${socket.id})`);
    connectedUsers.set(socket.data.username, socket.id);

    // Tentative d'attacher immédiatement la socket à une partie existante si on était en phase de reconnexion
    try {
        const username = socket.data.username;
        const managersByMode = [
            [GAME_MODE.PVP, pvpManager],
            [GAME_MODE.AI, aiManager]
        ];

        for (const [mode, manager] of managersByMode) {
            for (const [gameId, game] of manager.games.entries()) {
                if (!game) continue;
                if (game.p1_username === username && game.p1_id !== socket.id) {
                    const key = `${gameId}_${username}`;
                    const entry = reconnectionTimers.get(key);
                    if (entry) {
                        clearTimeout(entry.timeoutId);
                        reconnectionTimers.delete(key);
                    }
                    // remapper players
                    const old = game.p1_id;
                    if (game.players && old && game.players[old] !== undefined) {
                        game.players[socket.id] = game.players[old];
                        delete game.players[old];
                    } else {
                        game.players = game.players || {};
                        game.players[socket.id] = PLAYER.P1;
                    }
                    game.p1_id = socket.id;
                    io.to(gameId).emit("player-reconnected", { username });
                    socket.join(gameId);
                    socket.emit("init-state", engineStateWithRemaining(game.engine));
                    // If it's this player's turn, resume remaining timer if any
                    try {
                        const playerId = game.players ? game.players[socket.id] : null;
                        if (playerId && game.engine && game.engine.turn === playerId && typeof game.engine.remainingTurnMs === 'number') {
                            const rem = game.engine.remainingTurnMs;
                            if (rem > 0) {
                                game.engine.startTurnTimer(rem);
                                if (RECON_DEBUG) console.log(`[reconnect] restarted turn timer for ${username} with ${rem}ms`);
                            }
                        }
                    } catch (e) { console.error('Erreur redémarrage timer sur connection attach:', e); }
                }
                if (game.p2_username === username && game.p2_id !== socket.id) {
                    const key = `${gameId}_${username}`;
                    const entry = reconnectionTimers.get(key);
                    if (entry) {
                        clearTimeout(entry.timeoutId);
                        reconnectionTimers.delete(key);
                    }
                    const old2 = game.p2_id;
                    if (game.players && old2 && game.players[old2] !== undefined) {
                        game.players[socket.id] = game.players[old2];
                        delete game.players[old2];
                    } else {
                        game.players = game.players || {};
                        game.players[socket.id] = PLAYER.P2;
                    }
                    game.p2_id = socket.id;
                    io.to(gameId).emit("player-reconnected", { username });
                    socket.join(gameId);
                    socket.emit("init-state", engineStateWithRemaining(game.engine));
                }
            }
        }
    } catch (e) {
        console.error("Erreur lors de l'attachement automatique à la partie sur connection:", e);
    }

    socket.on("invite-friendly", (data) => {
        const targetUsername = data.to;
        const targetSocketId = connectedUsers.get(targetUsername);
        if(targetSocketId){
            io.to(targetSocketId).emit("NEW_FRIENDLY_MATCH", {
                from: socket.data.username,
                message: `Nouvelle demande de match amical de ${socket.data.username} !`
            });

            setTimeout(() => {
                if(!pvpManager.isMatchExisting(socket.data.username, targetUsername)){
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
        for (const [gameId, game] of pvpManager.games.entries()) {
            if (game.p1_id === socket.id || game.p2_id === socket.id) {
                pvpManager.finishGame(gameId);
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
    });

    socket.on("find-game", () => {
        console.log(`${socket.data.username} is looking for a game`);

        const existingIndex = waitingQueue.findIndex(s => s.data.username === socket.data.username);
        if (existingIndex !== -1) {
            waitingQueue[existingIndex] = socket;
        } else {
            waitingQueue.push(socket);
        }

        if (waitingQueue.length >= 2) {
            const player1 = waitingQueue[0];

            const opponentIndex = waitingQueue.findIndex(s => s.data.username !== player1.data.username);

            if (opponentIndex !== -1) {
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
                };

                pvpManager.createGame(matchInfo.gameId, player1, player2, matchInfo.isFriendly);
                player1.emit("match-found", matchInfo);
                player2.emit("match-found", matchInfo);
                const created = pvpManager.games.get(matchInfo.gameId);
                if (created && created.engine) created.engine.startTurnTimer()
                unlockAchievement(created.p1_token, "play_online");
                unlockAchievement(created.p2_token, "play_online");
            }
        } else {
            socket.emit("waiting-for-opponent");
        }
    });

    socket.on("launch-game", async () => {
        console.log(`${socket.data.username} is looking for a game`);
        const matchId = "game_" + Math.random().toString(36).substr(2, 10);
        const matchInfo = {
            gameId: matchId,
            player1: {
                username: socket.data.username,
                elo: socket.data.elo,
                rank: socket.data.rank
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
                socket.emit("init-state", engineStateWithRemaining(game.engine));
                // Relancer le timer côté backend si c'est le tour du joueur reconnecté
                unlockAchievement(socket.handshake.auth?.token, "play_ai");
                try {
                    const playerId = game.players ? game.players[socket.id] : null;
                    const rem = typeof game.engine.remainingTurnMs === 'number' ? game.engine.remainingTurnMs : null;
                    if (playerId && game.engine && game.engine.turn === playerId && typeof rem === 'number' && rem > 0) {
                        game.engine.startTurnTimer(rem);
                        if (RECON_DEBUG) console.log(`[reconnect] restarted turn timer on join-game for ${socket.data.username} with ${rem}ms`);
                    }
                } catch (e) { console.error('Erreur redémarrage timer sur join-game:', e); }
                // Si le joueur rejoint via l'action explicite, relancer le timer restant si c'est son tour
                try {
                    const playerId = game.players ? game.players[socket.id] : null;
                    if (playerId && game.engine && game.engine.turn === playerId && typeof game.engine.remainingTurnMs === 'number') {
                        const rem = game.engine.remainingTurnMs;
                        if (rem > 0) {
                            game.engine.startTurnTimer(rem);
                            if (RECON_DEBUG) console.log(`[reconnect] restarted turn timer for ${socket.data.username} with ${rem}ms`);
                        }
                    }
                } catch (e) { console.error('Erreur redémarrage timer sur join-game:', e); }
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

        // Si on rejoint une partie existante et que c'est une reconnexion, annuler le timer
        if (game) {
            try {
                // Vérifier si le joueur correspond à p1 ou p2 et mettre à jour l'id socket
                if (game.p1_username === socket.data.username && game.p1_id !== socket.id) {
                    // annuler timer s'il existait
                    const key = `${gameId}_${socket.data.username}`;
                    const entry = reconnectionTimers.get(key);
                    if (entry) {
                        clearTimeout(entry.timeoutId);
                        reconnectionTimers.delete(key);
                    }
                    // Mettre à jour la map players (clé = socket.id)
                    const oldId = game.p1_id;
                    if (game.players && oldId && game.players[oldId] !== undefined) {
                        game.players[socket.id] = game.players[oldId];
                        delete game.players[oldId];
                    }
                    game.p1_id = socket.id;
                    // Ne pas relancer automatiquement le timer ici pour éviter de réinitialiser la fenêtre
                    if (RECON_DEBUG) console.log(`[reconnect] p1 reattached: game=${gameId} oldId=${oldId} newId=${socket.id}`);
                    io.to(gameId).emit("player-reconnected", { username: socket.data.username });
                }

                if (game.p2_username === socket.data.username && game.p2_id !== socket.id) {
                    const key = `${gameId}_${socket.data.username}`;
                    const entry = reconnectionTimers.get(key);
                    if (entry) {
                        clearTimeout(entry.timeoutId);
                        reconnectionTimers.delete(key);
                    }
                    // Mettre à jour la map players (clé = socket.id)
                    const oldId = game.p2_id;
                    if (game.players && oldId && game.players[oldId] !== undefined) {
                        game.players[socket.id] = game.players[oldId];
                        delete game.players[oldId];
                    }
                    game.p2_id = socket.id;
                    if (RECON_DEBUG) console.log(`[reconnect] p2 reattached: game=${gameId} oldId=${oldId} newId=${socket.id}`);
                    io.to(gameId).emit("player-reconnected", { username: socket.data.username });
                }

                socket.emit("init-state", engineStateWithRemaining(game.engine));
            } catch (e) {
                console.error("Erreur lors de la gestion de la reconnexion :", e);
                socket.emit("game-closed", "Impossible de rejoindre la partie.");
            }
        }
    });

    // Permet au client de demander explicitement l'état actuel d'une partie
    socket.on('fetch-state', (gameId, cb) => {
        try {
            const {manager} = getManagerForGame(gameId);
            if (!manager) {
                if (typeof cb === 'function') cb(null);
                return;
            }
            const game = manager.games.get(gameId);
            if (!game || !game.engine) {
                if (typeof cb === 'function') cb(null);
                return;
            }
            const state = engineStateWithRemaining(game.engine);
            if (typeof cb === 'function') cb(state);
        } catch (e) {
            console.error('Erreur fetch-state:', e);
            if (typeof cb === 'function') cb(null);
        }
    });



    socket.on("join-friendly", (data) => {
        const me = socket;
        const senderSocketId = connectedUsers.get(data.from);

        if (pvpManager.isMatchExisting(socket.data.username, data.from)) {
            return;
        }

        if (!senderSocketId) {
            socket.emit("invitation-expired", {message: "Joueur déconnecté."});
            return;
        }

        if(pvpManager.isPlayerInGame(data.from)){
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

        pvpManager.createGame(matchInfo.gameId, me, senderSocket, matchInfo.isFriendly);

        me.emit("friendly-match-found", matchInfo);
        senderSocket.emit("friendly-match-found", matchInfo);
    });

    socket.on("player-action", async (data) => {
        const {manager, mode} = getManagerForGame(data.gameId);
        const resolvedManager = manager || pvpManager;
        const handler = resolvedManager && typeof resolvedManager.handleAction === 'function' ? resolvedManager : pvpManager;
        // tentative de réparation des mappings après reconnexion : si la map game.players
        // utilise encore l'ancien socket.id, remplacer la clé par le nouveau socket.id
        const game = (resolvedManager || pvpManager).games.get(data.gameId);
        function ensurePlayerMapping(gameObj, sock) {
            if (!gameObj) return;
            try {
                // si players n'existe pas, rien à faire
                if (!gameObj.players) return;
                // p1
                if (gameObj.p1_username === sock.data.username && gameObj.p1_id !== sock.id) {
                    const old = gameObj.p1_id;
                    if (old && gameObj.players[old] !== undefined) {
                        gameObj.players[sock.id] = gameObj.players[old];
                        delete gameObj.players[old];
                    } else {
                        // fallback: assigner directement
                        gameObj.players[sock.id] = PLAYER.P1;
                    }
                    gameObj.p1_id = sock.id;
                    if (RECON_DEBUG) console.log("[ensurePlayerMapping] p1 remapped", {gameId: data.gameId, old, new: sock.id});
                }
                // p2
                if (gameObj.p2_username === sock.data.username && gameObj.p2_id !== sock.id) {
                    const old2 = gameObj.p2_id;
                    if (old2 && gameObj.players[old2] !== undefined) {
                        gameObj.players[sock.id] = gameObj.players[old2];
                        delete gameObj.players[old2];
                    } else {
                        gameObj.players[sock.id] = PLAYER.P2;
                    }
                    gameObj.p2_id = sock.id;
                    if (RECON_DEBUG) console.log("[ensurePlayerMapping] p2 remapped", {gameId: data.gameId, old: old2, new: sock.id});
                }
            } catch (e) {
                console.error("Erreur ensurePlayerMapping:", e);
            }
        }

        ensurePlayerMapping(game, socket);

        const result = await handler.handleAction(data.gameId, socket.id, data);

        if (!result) {
            const game = (resolvedManager || pvpManager).games.get(data.gameId);
            console.log("Erreur : Impossible de traiter l'action pour la partie", data.gameId, {
                socketId: socket.id,
                username: socket.data.username,
                gamePlayers: game ? game.players : null,
                p1_id: game ? game.p1_id : null,
                p2_id: game ? game.p2_id : null,
            });
            return;
        }

        if (result.error) {
            const game = (resolvedManager || pvpManager).games.get(data.gameId);
            console.log("Action refusée :", result.error, {
                socketId: socket.id,
                username: socket.data.username,
                gamePlayers: game ? game.players : null,
                p1_id: game ? game.p1_id : null,
                p2_id: game ? game.p2_id : null,
            });
            return;
        }

        // Achievement gagner contre l'ia
        if (result.winner) {
            const gameInfo = manager.games.get(data.gameId);
            if (mode === GAME_MODE.AI && result.winner === 1) {
                unlockAchievement(socket.handshake.auth?.token, "win_ai");
            } else if (mode === GAME_MODE.PVP) {
                const winnerToken = result.winner === 1 ? gameInfo.p1_token : gameInfo.p2_token;
                unlockAchievement(winnerToken, "win_online");
            }
        }
        io.to(data.gameId).emit("game-update", result);

        if (result.isProcessingTurn) {
            setTimeout(async () => {
                finalizeAndEmit(data.gameId, resolvedManager);
                if (mode === GAME_MODE.AI) {
                    await maybePlayAiTurn(data.gameId);
                }
            }, HUMAN_TURN_ANIMATION_DELAY_MS);
            return;
        }

        if (result.winner) {
            io.to(data.gameId).emit("game-over", result);
            const game = (resolvedManager || pvpManager).games.get(data.gameId);
            // result.winner vaut 1 (PLAYER.P1) ou 2 (PLAYER.P2)
            if (game) {
                const winnerUsername = result.winner === 1 ? game.p1_username : game.p2_username;
                const looserUsername = result.winner === 1 ? game.p2_username : game.p1_username;
                if (!data.isFriendly && mode === GAME_MODE.PVP) await eloUpdate(data.gameId, winnerUsername, looserUsername);
            }
        }
    });

    socket.on("revenge", async (gameId) => {
        const {manager} = getManagerForGame(gameId);
        if (!manager) {
            socket.emit("game-closed");
            return;
        }

        const result = await manager.revenge(gameId);

        if(result === "1") return;

        if (result == null) {
            socket.emit("game-closed");
        }
        else{
            io.to(gameId).emit("revenge-granted", result);
            try {
                const game = manager.games.get(gameId);
                if (game && game.engine) {
                    io.to(gameId).emit("init-state", engineStateWithRemaining(game.engine));
                } else {
                    io.to(gameId).emit("init-state", result);
                }
            } catch (e) {
                console.error('Erreur emission init-state après revenge:', e);
                io.to(gameId).emit("init-state", result);
            }
        }
    });

    socket.on("leave-game", (gameId) => {
        pvpManager.finishGame(gameId);
        io.to(gameId).emit("back-to-homepage");
        console.log(`Revanche non demandée. Partie d'id : [${gameId}] nettoyée de la mémoire.`);
    });

    socket.on("disconnect", async () => {
        console.log(`Joueur déconnecté : ${socket.data.username}`);
        connectedUsers.delete(socket.data.username);

        const index = waitingQueue.findIndex(s => s.id === socket.id);
        if (index !== -1) waitingQueue.splice(index, 1);

        const managersByMode = [
            [GAME_MODE.PVP, pvpManager],
            [GAME_MODE.AI, aiManager]
        ];

        // Au lieu de terminer immédiatement la partie, démarrer une fenêtre de reconnexion
        for (const [mode, manager] of managersByMode) {
            for (const [gameId, game] of manager.games.entries()) {
                if (game.p1_id === socket.id || game.p2_id === socket.id) {
                    const disconnectedUsername = socket.data.username;

                    // Attribution immédiate de la victoire à l'adversaire
                    try {
                        const winnerIsP2 = (game.p1_username === disconnectedUsername);
                        const winnerPlayer = winnerIsP2 ? 2 : 1;
                        const winnerUsername = winnerIsP2 ? game.p2_username : game.p1_username;

                        io.to(gameId).emit("game-over", { message: "Ton adversaire a quitté la partie. Tu as gagné par forfait !", winner: winnerPlayer });

                        if (mode === GAME_MODE.PVP) {
                          const winnerToken = game.p1_id === socket.id ? game.p2_token : game.p1_token;
                          unlockAchievement(winnerToken, "win_online");
                        }

                        if (!game.isFriendly && mode === GAME_MODE.PVP) {
                            try {
                                await eloUpdate(gameId, winnerUsername, disconnectedUsername);
                            } catch (e) {
                                console.error("Erreur eloUpdate après disconnect:", e);
                            }
                        }

                        // arrêter et nettoyer la partie immédiatement
                        try {
                            if (game.engine && typeof game.engine.stopTurnTimer === 'function') game.engine.stopTurnTimer();
                        } catch (e) { /* ignore */ }

                        try {
                            manager.finishGame(gameId);
                        } catch (e) {
                            console.error("Erreur lors du nettoyage de la partie après disconnect:", e);
                        }

                        // nettoyer toute trace de timer de reconnexion
                        const key = `${gameId}_${disconnectedUsername}`;
                        if (reconnectionTimers.has(key)) {
                            clearTimeout(reconnectionTimers.get(key).timeoutId);
                            reconnectionTimers.delete(key);
                        }
                        gameModes.delete(gameId);
                    } catch (e) {
                        console.error('Erreur lors du traitement immédiat du disconnect :', e);
                    }
                }
            }
        }
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
});
