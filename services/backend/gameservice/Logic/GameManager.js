import {GameEngine} from "./GameEngine.js";
import {PLAYER} from "./../Model/model.js";

export class GameManager {
    constructor(){
        this.games = new Map();
    }

    createGame(gameId, player1Id, player2Id){
        this.games.set(gameId, {
            engine: new GameEngine(),
            players: { [player1Id]: PLAYER.P1, [player2Id]: PLAYER.P2 },
            p1_id: player1Id,
            p2_id: player2Id,
            revenges: 0
        });
        console.log(`Partie ${gameId} créée entre ${player1Id} et ${player2Id}`);
    }

    revenge(gameId){
        let game = this.games.get(gameId);
        if(game && game.revenges < 2){
            game.engine.restart();
            game.revenges++;
            return game.engine.getState();
        }
        else{
            console.log("La revanche ne peut plus être demandée. Plus de 2 revanches effectuées.");
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

        return game.engine.getState();
    }

    finishGame(gameId){
        if(this.games.has(gameId)){
            this.games.delete(gameId);
            console.log(`Nettoyage : partie ${gameId} supprimée de la mémoire.`);
        }
    }
}