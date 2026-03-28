import {buildGameEntry, validateActionForPlayer, applyActionAndGetState, restartIfRevengeAllowed} from "./ManagerHelper.js";

export class GameManager {
    constructor(){
        this.games = new Map();
    }

    createGame(gameId, player1Id, player2Id){
        this.games.set(gameId, buildGameEntry({player1Id, player2Id}));
        console.log(`Partie ${gameId} créée entre ${player1Id} et ${player2Id}`);
    }

    revenge(gameId){
        let game = this.games.get(gameId);
        const result = restartIfRevengeAllowed(game);
        if(result){
            return result;
        } else {
            console.log("La revanche ne peut plus être demandée. Plus de 2 revanches effectuées.");
        }
    }

    handleAction(gameId, playerId, actionData){
        const game = this.games.get(gameId);
        if(!game) return null;

        const validationError = validateActionForPlayer(game, playerId);
        if(validationError) return { error: validationError };

        return applyActionAndGetState(game, actionData);
    }

    finishGame(gameId){
        if(this.games.has(gameId)){
            this.games.delete(gameId);
            console.log(`Nettoyage : partie ${gameId} supprimée de la mémoire.`);
        }
    }
}