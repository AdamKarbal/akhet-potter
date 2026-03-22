import {GameManager} from "./GameManager.js";
import {GameEngine} from "./GameEngine.js";
import {PLAYER} from "../Model/model.js";
import {nextMove} from "../akhet-potter.js";


export class AIGameManager extends GameManager {
  constructor() {
    super();
  }

  createGame(gameId, player1Id) {
    this.games.set(gameId, {
      engine: new GameEngine(),
      players: {[player1Id]: PLAYER.P1},
      p1_id: player1Id,
      p2_id: null,
      revenges: 0,
      ai: true
    });
    console.log(`Partie ${gameId} créée entre ${player1Id} et l'IA`);
  }

  async handleAction(gameId, playerId, actionData) {
    const res = super.handleAction(gameId, playerId, actionData);
    if (res?.error) return res;

    const game = this.games.get(gameId);
    if (game && !game.engine.winner) {
      const humanExternal = this.actionToExternal(actionData);
      const aiExternal = await nextMove(humanExternal);
      const aiAction = this.externalToAction(aiExternal);
      game.engine.handlePlayerInteraction(
        aiAction.x,
        aiAction.y,
        aiAction.relX,
        aiAction.relY
      );
    }
    return game.engine.getState();
  }

  actionToExternal(action) {
    if (!action) return null;

  }

  externalToAction(ext) {
    if (!ext) return null;
  }
}