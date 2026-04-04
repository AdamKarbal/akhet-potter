import {GameEngine} from "./GameEngine.js";
import {PLAYER} from "../Model/model.js";

function buildPlayersMap(player1Id, player2Id) {
    const players = {[player1Id]: PLAYER.P1};
    if (player2Id) {
        players[player2Id] = PLAYER.P2;
    }
    return players;
}

export function buildGameEntry({player1Id, player2Id = null, engine = new GameEngine(), ai = false}) {
    const game = {
        engine,
        players: buildPlayersMap(player1Id, player2Id),
        p1_id: player1Id,
        p2_id: player2Id,
        revenges: 0
    };

    if (ai) {
        game.ai = true;
    }

    return game;
}

export function validateActionForPlayer(game, playerId) {
    if (game.engine.winner) {
        return "Partie terminée, victoire du joueur " + game.engine.winner;
    }

    let playerTurn = game.players[playerId];

    // Support d'un mode local historique où un même socket contrôlait les 2 camps.
    if (game.p1_id === game.p2_id && game.p1_id === playerId) {
        playerTurn = game.engine.turn;
    }

    if (!playerTurn) return "Vous n'êtes pas joueur de cette partie.";
    if (playerTurn !== game.engine.turn) return "Pas votre tour.";
    return null;
}

export function applyActionAndGetState(game, actionData) {
    game.engine.handlePlayerInteraction(
        actionData.x,
        actionData.y,
        actionData.relX,
        actionData.relY,
    );

    return game.engine.getState();
}

export function restartIfRevengeAllowed(game) {
    if (game && game.revenges < 2) {
        game.engine.restart();
        game.revenges++;
        return game.engine.getState();
    }

    return null;
}
