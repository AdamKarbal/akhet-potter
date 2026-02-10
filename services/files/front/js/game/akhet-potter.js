/**
 * @typedef {Object} GameAdapter
 * @property {function(any): Array<any>} getPossibleMoves
 * @property {function(any, any): any} applyMove
 * @property {function(any): boolean} isTerminal
 * @property {function(any): number} evaluate
 * @property {function(any): any} getCurrentPlayer
 */

// ------------------------------
// "Defines" / paramètres globaux
// ------------------------------
// Encodage d'une "coordonnée" dans un Uint16:
// - bits 0..7  : position (0..255)
// - bits 8..15 : direction
const COORD_POSITION_MASK = 0xff;
const COORD_DIRECTION_SHIFT = 8;

// Pièces / encodages (à compléter au besoin)
const PIECE_PYRAMID = 1 << 7;

/**
 * Strategy contract (typedef)
 * @typedef {Object} Strategy
 * @property {function(any): any} findBestMove
 */

// Core: Minimax engine (pure search)
export class Minimax {
  constructor(adapter) {
    this.adapter = adapter;
  }

  // Signature stable pour LSP : isMaximizingPlayer, alpha, beta optionnels
  minimax(state, depth, isMaximizingPlayer, alpha = -Infinity, beta = Infinity) {
    if (depth === 0 || this.adapter.isTerminal(state)) {
      return this.adapter.evaluate(state);
    }

    let value = isMaximizingPlayer ? -Infinity : Infinity;
    const moves = this.adapter.getPossibleMoves(state) || [];

    for (const move of moves) {
      const newState = this.adapter.applyMove(state, move);
      const score = this.minimax(newState, depth - 1, !isMaximizingPlayer, alpha, beta);
      if (isMaximizingPlayer) value = Math.max(value, score);
      else value = Math.min(value, score);
    }

    return value;
  }
}

// Core: Alpha-Beta engine extends Minimax and overrides minimax with pruning
export class AlphaBeta extends Minimax {
  minimax(state, depth, isMaximizingPlayer, alpha = -Infinity, beta = Infinity) {
    if (depth === 0 || this.adapter.isTerminal(state)) {
      return this.adapter.evaluate(state);
    }

    const moves = this.adapter.getPossibleMoves(state) || [];

    let value = isMaximizingPlayer ? -Infinity : Infinity;
    for (const move of moves) {
      const newState = this.adapter.applyMove(state, move);
      const score = this.minimax(newState, depth - 1, !isMaximizingPlayer, alpha, beta);

      if (isMaximizingPlayer) {
        value = Math.max(value, score);
        alpha = Math.max(alpha, value);
      } else {
        value = Math.min(value, score);
        beta = Math.min(beta, value);
      }

      if (beta <= alpha) break; // Cut-off
    }
    return value;
  }
}


// Abstract base class for strategies (acts like an 'interface')
export class Strategy {
  constructor(adapter, maxDepth) {
    if (new.target === Strategy) {
      throw new Error('Strategy is abstract and cannot be instantiated directly.');
    }
    this.adapter = adapter;
    this.maxDepth = maxDepth;
  }

  /**
   * Compute the best move for the given state.
   * @param {any} state
   * @returns {any} move
   */
  findBestMove(state) {
    throw new Error('findBestMove must be implemented by subclasses');
  }
}

// Strategy: MinimaxStrategy uses Minimax to evaluate moves and choose the best
export class MinimaxStrategy extends Strategy {
  constructor(adapter, maxDepth) {
    super(adapter, maxDepth);
    this.engine = new Minimax(adapter);
  }

  findBestMove(state) {
    const moves = this.adapter.getPossibleMoves(state) || [];
    if (moves.length === 0) return null;

    let bestMove = null;
    let bestValue = -Infinity;

    for (const move of moves) {
      const newState = this.adapter.applyMove(state, move);
      const moveValue = this.engine.minimax(newState, this.maxDepth - 1, false);
      if (moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
    }

    return bestMove;
  }
}

// Strategy: AlphaBetaStrategy uses AlphaBeta for pruning
export class AlphaBetaStrategy extends Strategy {
  constructor(adapter, maxDepth) {
    super(adapter, maxDepth);
    this.engine = new AlphaBeta(adapter);
  }

  findBestMove(state) {
    const moves = this.adapter.getPossibleMoves(state) || [];
    if (moves.length === 0) return null;

    let bestMove = null;
    let bestValue = -Infinity;
    let alpha = -Infinity;
    for (const move of moves) {
      const newState = this.adapter.applyMove(state, move);
      const moveValue = this.engine.minimax(newState, this.maxDepth - 1, false, alpha);
      if (moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
      alpha = Math.max(alpha, moveValue);
    }

    return bestMove;
  }
}

export function setup(initialPositions, isFirstPlayer) {
  const state = new Uint16Array(24);

  const SELF_OFFSET = isFirstPlayer ? 0 : 12;
  const OPP_OFFSET  = isFirstPlayer ? 12 : 0;

  {
    const sph = initialPositions.sphinx;
    const sphMirror = 99 - sph;
    const ph = initialPositions.pharaoh;
    const phMirror = 99 - ph;

    // Sphinx / Pharaoh
    state[SELF_OFFSET + 0] = sph;
    state[OPP_OFFSET + 0] = sphMirror;

    state[SELF_OFFSET + 1] = ph;
    state[OPP_OFFSET + 1] = phMirror;

    // Pièce(s) liées au pharaoh (selon ton encodage)
    const phCol = getColumn(ph);
    state[SELF_OFFSET + 2]  = computeCoordinates(computePosition(5, phCol), 2);
    state[OPP_OFFSET + 2] = computeCoordinates(computePosition(6, 11 - phCol), 0);

    // Pièce(s) liées au sphinx (selon ton encodage)
    state[SELF_OFFSET + 4]  = computeCoordinates(computePosition(3, getColumn(sphMirror)), 2);
    state[OPP_OFFSET + 3] = computeCoordinates(computePosition(8, 11 - getColumn(sph)), 0);

    // Scarab
    const sp = initialPositions.scarab.position;
    const so = initialPositions.scarab.orientation;
    state[SELF_OFFSET + 5]  = computeCoordinates(sp, shitDirection2Direction(so));
    state[OPP_OFFSET + 4] = computeCoordinates(99 - sp, shitDirection2Direction(9 - so));

    // Pyramides (remplissage bloc)
    state.fill(PIECE_PYRAMID, SELF_OFFSET + 6, SELF_OFFSET + 12);
    state.fill(PIECE_PYRAMID, OPP_OFFSET + 5, OPP_OFFSET + 12);
  }

  return state;
}


function direction2ShitDirection(shitDirection){
  switch (shitDirection) {
    case 0: return 0;
    case 1: return 9;
    case 2: return 90;
    case 3: return 99;
    default: throw new Error(`Invalid shitDirection: ${shitDirection}`);
  }
}

function shitDirection2Direction(direction){
  switch (direction) {
    case 0: return 0;
    case 9: return 1;
    case 90: return 2;
    case 99: return 3;
    default: throw new Error(`Invalid direction: ${direction}`);
  }
}

function getLine(coordinates){
  return (getPosition(coordinates) / 10 | 0) + 1;
}

function getColumn(coordinates){
  return (getPosition(coordinates) % 10) + 1;
}

function computePosition(line, column){
  return (line - 1) * 10 + (column - 1);
}

function computeCoordinates(position, direction){
  return position | (direction << COORD_DIRECTION_SHIFT);
}

export function nextMove(opponentAction) {
  // To be implemented
}


function getDirection(coordinates){
  return coordinates >> COORD_DIRECTION_SHIFT;
}

function getPosition(coordinates){
  return coordinates & COORD_POSITION_MASK;
}
