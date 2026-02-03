/**
 * @typedef {Object} GameAdapter
 * @property {function(any): Array<any>} getPossibleMoves
 * @property {function(any, any): any} applyMove
 * @property {function(any): boolean} isTerminal
 * @property {function(any): number} evaluate
 * @property {function(any): any} getCurrentPlayer
 */

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

function getDirection(coordinates){
  return coordinates >> 7;
}

function getPosition(coordinates){
  return coordinates & 127;
}

