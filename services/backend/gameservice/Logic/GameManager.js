import {buildGameEntry, validateActionForPlayer, applyActionAndGetState, restartIfRevengeAllowed} from "./ManagerHelper.js";

export class GameManager {
    constructor(io){
        this.games = new Map();
        this.io = io;
    }

    isPlayerInGame(username){
        for (const game of this.games.values()) {
            if (game.p1_username === username || game.p2_username === username) {
                return true;
            }
        }
        return false;
    }

    isMatchExisting(user1, user2) {
        for (const game of this.games.values()) {
            const players = [game.p1_username, game.p2_username];
            if (players.includes(user1) && players.includes(user2)) return true;
        }
        return false;
    }

    createGame(gameId, player1, player2, isFriendly){
        this.games.set(gameId, {
            engine: new GameEngine(),
            players: {
                [player1.id]: PLAYER.P1,
                [player2.id]: PLAYER.P2
            },
            p1_id: player1.id,
            p2_id: player2.id,
            p1_username: player1.data.username,
            p2_username: player2.data.username,
            isFriendly: isFriendly,
            revenges: 0,
            revenge_req_counter: 0
        });
        console.log(`Partie ${isFriendly ? "amicale" : ""} ${gameId} créée entre ${player1.data.username} et ${player2.data.username}`);
    }
    createGame(gameId, player1Id, player2Id){
        this.games.set(gameId, buildGameEntry({player1Id, player2Id}));
        console.log(`Partie ${gameId} créée entre ${player1Id} et ${player2Id}`);
    }

    revenge(gameId){
        let game = this.games.get(gameId);
        if(game && game.revenges < 2 ){
            game.revenge_req_counter++;
            this.io.to(gameId).emit("revenge-request", (game.revenge_req_counter));
            if(game.revenge_req_counter === 2){
                game.revenge_req_counter = 0;
                game.engine.restart();
                game.revenges++;
                return game.engine.getState();
            }
            else{
                return "1";
            }
        }
        else if(!game){
            console.log("Partie déjà nettoyée. Revanche impossible.");
            return null;
        }
        else if (game.revenges >= 2){
        const result = restartIfRevengeAllowed(game);
        if(result){
            return result;
        } else {
            console.log("La revanche ne peut plus être demandée. Plus de 2 revanches effectuées.");
            return null;
        }
    }

    handleAction(gameId, playerId, actionData){
        const game = this.games.get(gameId);
        if(!game) return null;

        if (game.engine.winner) {
            return { error: "Partie terminée, victoire du joueur " + game.engine.winner };
        }

        let playerTurn = game.players[playerId];

        if (game.p1_id === game.p2_id && game.p1_id === playerId) {
            playerTurn = game.engine.turn;
        }

        if(!playerTurn) return { error: "Vous n'êtes pas joueur de cette partie."};
        if(playerTurn !== game.engine.turn) return {error: "Pas votre tour."};

        game.engine.handlePlayerInteraction(
            actionData.x,
            actionData.y,
            actionData.relX,
            actionData.relY,
        );
        const validationError = validateActionForPlayer(game, playerId);
        if(validationError) return { error: validationError };

        return applyActionAndGetState(game, actionData);
    }

    finishGame(gameId){
        if(this.games.has(gameId)){
            this.games.delete(gameId);
            console.log(`Nettoyage [GameManager] : partie ${gameId} supprimée de la mémoire.`);
        }
    }
}