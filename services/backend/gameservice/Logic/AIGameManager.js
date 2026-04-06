import {GameEngine} from "./GameEngine.js";
import {PLAYER, PIECE_TYPE} from "../Model/model.js";
import {buildGameEntry, handleActionOnGame} from "./ManagerHelper.js";
import {nextMove, setup} from "../akhet-potter.js";

function toSetupCoordinates(cell, rotation) {
  const dir = Math.floor(rotation / 90) % 4;
  return cell | (dir << 8);
}

function toSetupScarabOrientation(rotation) {
  const normalized = ((rotation % 360) + 360) % 360;
  if (normalized === 0 || normalized === 180) return 0;
  if (normalized === 90 || normalized === 270) return 9;
  throw new Error(`Rotation scarab invalide: ${rotation}`);
}

function externalToRotation(orientation) {
  switch (orientation) {
    case 0: return 0;
    case 9: return 90;
    case 90: return 180;
    case 99: return 270;
    default: throw new Error(`Orientation externe invalide: ${orientation}`);
  }
}

function xyToCell(x, y) {
  return x * 10 + y;
}

function cellToXY(cell) {
  return { x: Math.floor(cell / 10), y: cell % 10 };
}

function normalizeActionCell(cellLike) {
  if (typeof cellLike === "number") return cellLike;
  if (!cellLike) return null;
  if (typeof cellLike.x === "number" && typeof cellLike.y === "number") {
    return xyToCell(cellLike.x, cellLike.y);
  }
  return null;
}

function findDifferentCell(x, y) {
  return x < 9 ? {x: x + 1, y} : {x: x - 1, y};
}

function buildAiCannotPlayError(reason) {
  return {
    error: `IA incapable de jouer: ${reason}`,
    code: "AI_CANNOT_PLAY"
  };
}

export class AIGameManager {
  constructor() {
    this.games = new Map();
    this.aiLock = Promise.resolve();
  }

  runWithAiLock(task) {
    const run = this.aiLock.then(() => task());
    // Keep lock chain alive even if one task fails.
    this.aiLock = run.catch(() => undefined);
    return run;
  }

  async createGame(gameId, player1Id) {
    const engine = new GameEngine();
    this.games.set(gameId, buildGameEntry({player1Id, player2Id: null, engine, ai: true}));

    try {
      await this.runWithAiLock(() => this.initializeAI(gameId));
    } catch (error) {
      this.games.delete(gameId);
      throw error;
    }
    console.log(`Partie ${gameId} créée entre ${player1Id} et l'IA`);
  }

  async revenge(gameId) {
    const result = super.revenge(gameId);
    if (!result) return result;

    const game = this.games.get(gameId);
    if (game?.ai) {
      await this.runWithAiLock(() => this.initializeAI(gameId));
    }
    return result;
  }

  async playAiTurn(gameId) {
    const game = this.games.get(gameId);
    if (!game || !game.ai) return null;
    if (game.engine.winner || game.engine.turn !== PLAYER.P2 || game.engine.isProcessingTurn) {
      return game.engine.getState();
    }

    const turnBefore = game.engine.turn;

    const didCommitTurn = () => game.engine.turn !== turnBefore || !!game.engine.winner;

    const tryFallbackTurn = (reason) => {
      try {
        this.forceAiFallbackTurn(game.engine);
      } catch (error) {
        return buildAiCannotPlayError(`${reason} (${error.message})`);
      }

      if (!didCommitTurn()) {
        return buildAiCannotPlayError(`${reason} (fallback non valide)`);
      }

      return null;
    };

    const humanExternal = this.actionToExternal(gameId);
    if (!humanExternal) {
      const fallbackError = tryFallbackTurn("dernier coup humain introuvable");
      if (fallbackError) return fallbackError;
      return game.engine.getState();
    }

    try {
      const aiExternal = await this.runWithAiLock(() => nextMove(humanExternal));
      if (!aiExternal) {
        const fallbackError = tryFallbackTurn("coup IA vide");
        if (fallbackError) return fallbackError;
        return game.engine.getState();
      }
      this.applyExternalActionAsInteractions(game.engine, aiExternal);
    } catch (error) {
      console.error("Erreur IA nextMove:", error);
      const fallbackError = tryFallbackTurn("erreur du moteur IA");
      if (fallbackError) return fallbackError;
      return game.engine.getState();
    }

    if (!didCommitTurn()) {
      const fallbackError = tryFallbackTurn("coup IA non validé");
      if (fallbackError) return fallbackError;
    }

    return game.engine.getState();
  }

  forceAiFallbackTurn(engine) {
    if (!engine || engine.winner || engine.turn !== PLAYER.P2 || engine.isProcessingTurn) {
      return;
    }

    // Si l'IA a laissé un mode pending ouvert, on l'annule d'abord.
    if (engine.pendingPlacement) {
      const cancelCell = findDifferentCell(engine.pendingPlacement.x, engine.pendingPlacement.y);
      engine.handlePlayerInteraction(cancelCell.x, cancelCell.y, 0.5, 0.5);
    }
    if (engine.pendingRotation) {
      const cancelCell = findDifferentCell(engine.pendingRotation.x, engine.pendingRotation.y);
      engine.handlePlayerInteraction(cancelCell.x, cancelCell.y, 0.5, 0.5);
    }
    engine.selectedPiece = null;

    // Fallback robuste: rotation simple du sphinx pour garantir la fin de tour.
    const refs = this.extractPlayerReferencePieces(engine, PLAYER.P2);
    const at = cellToXY(refs.sphinx.cell);
    engine.handlePlayerInteraction(at.x, at.y, 0.5, 0.5);
    engine.handlePlayerInteraction(at.x, at.y, 0.5, 0.5);
    engine.handlePlayerInteraction(at.x, at.y, 0.75, 0.75);
  }

  async initializeAI(gameId) {
    const game = this.games.get(gameId);
    if (!game?.engine) return;

    const p2Pieces = this.extractPlayerReferencePieces(game.engine, PLAYER.P2);
    await setup({
      sphinx: toSetupCoordinates(p2Pieces.sphinx.cell, p2Pieces.sphinx.rotation),
      pharaoh: toSetupCoordinates(p2Pieces.pharaoh.cell, p2Pieces.pharaoh.rotation),
      scarab: {
        position: p2Pieces.scarab.cell,
        orientation: toSetupScarabOrientation(p2Pieces.scarab.rotation)
      }
    }, false);
  }

  extractPlayerReferencePieces(engine, owner) {
    const refs = {sphinx: null, pharaoh: null, scarab: null};

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const piece = engine.board.getPiece(x, y);
        if (!piece || piece.owner !== owner) continue;

        const cell = xyToCell(x, y);
        if (piece.type === PIECE_TYPE.SPHINX) refs.sphinx = {cell, rotation: piece.rotation};
        if (piece.type === PIECE_TYPE.PHARAON) refs.pharaoh = {cell, rotation: piece.rotation};
        if (piece.type === PIECE_TYPE.SCARAB) refs.scarab = {cell, rotation: piece.rotation};
      }
    }

    if (!refs.sphinx || !refs.pharaoh || !refs.scarab) {
      throw new Error("Impossible d'initialiser l'IA: pièces de référence introuvables.");
    }

    return refs;
  }

  actionToExternal(gameId) {
    const game = this.games.get(gameId);
    const action = game?.engine?.lastAction;
    if (!action) return null;

    switch (action.action) {
      case "MOVE":
      case "EXCHANGE":
        return {
          action: action.action,
          cell: normalizeActionCell(action.cell),
          result: normalizeActionCell(action.result)
        };
      case "ROTATE":
        return {
          action: action.action,
          cell: normalizeActionCell(action.cell),
          result: action.result
        };
      case "PLACE": {
        // Place utilise un payload atypique dans ce codebase, on supporte les 2 formes.
        const payload = action.result || action.cell;
        return {
          action: "PLACE",
          cell: 0,
          result: {
            destination: normalizeActionCell(payload?.destination),
            orientation: payload?.orientation
          }
        };
      }
      default:
        return null;
    }
  }

  applyExternalActionAsInteractions(engine, extAction) {
    if (!extAction) return;

    if (extAction.action === "MOVE" || extAction.action === "EXCHANGE") {
      const from = cellToXY(extAction.cell);
      const to = cellToXY(extAction.result);
      engine.handlePlayerInteraction(from.x, from.y, 0.5, 0.5);
      engine.handlePlayerInteraction(to.x, to.y, 0.5, 0.5);
      return;
    }

    if (extAction.action === "ROTATE") {
      const at = cellToXY(extAction.cell);
      engine.handlePlayerInteraction(at.x, at.y, 0.5, 0.5);
      engine.handlePlayerInteraction(at.x, at.y, 0.5, 0.5);

      if (extAction.result === "ANTICLOCKWISE") {
        // Un clic intermédiaire supplémentaire bascule de +90° vers -90°.
        engine.handlePlayerInteraction(at.x, at.y, 0.5, 0.5);
      }

      engine.handlePlayerInteraction(at.x, at.y, 0.75, 0.75);
      return;
    }

    if (extAction.action === "PLACE") {
      const destination = cellToXY(extAction.result.destination);
      engine.handlePlayerInteraction(destination.x, destination.y, 0.5, 0.5);

      const currentRotation = engine.pendingPlacement?.rotation;
      const targetRotation = externalToRotation(extAction.result.orientation);
      let steps = 0;
      if (typeof currentRotation === "number") {
        steps = ((targetRotation - currentRotation + 360) % 360) / 90;
      }

      for (let i = 0; i < steps; i++) {
        engine.handlePlayerInteraction(destination.x, destination.y, 0.5, 0.5);
      }
      engine.handlePlayerInteraction(destination.x, destination.y, 0.75, 0.75);
    }
  }

  handleAction(gameId, playerId, actionData){
    const game = this.games.get(gameId);
    return handleActionOnGame(game, playerId, actionData);
  }
}