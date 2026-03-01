export class Minimax {
  constructor(adapter) {
    this.adapter = adapter;
    this.deadlineMs = Infinity;
    this.stopBufferMs = 5;
  }

  setDeadline(deadlineMs) {
    this.deadlineMs = deadlineMs ?? Infinity;
  }

  shouldStop() {
    return Date.now() >= (this.deadlineMs - this.stopBufferMs);
  }

  minimax(state, depth, isMaximizingPlayer, alpha = -Infinity, beta = Infinity) {
    if (this.shouldStop()) {
      return this.adapter.evaluate(state);
    }

    if (depth === 0 || this.adapter.isTerminal(state)) {
      return this.adapter.evaluate(state);
    }

    let value = isMaximizingPlayer ? -Infinity : Infinity;
    const moves = this.adapter.getPossibleMoves(state) || [];

    for (const move of moves) {
      if (this.shouldStop()) break;
      const newState = this.adapter.applyMove(state, move);
      const score = this.minimax(newState, depth - 1, !isMaximizingPlayer, alpha, beta);
      if (isMaximizingPlayer) value = Math.max(value, score);
      else value = Math.min(value, score);
    }

    return value;
  }
}

export class AlphaBeta extends Minimax {
  minimax(state, depth, isMaximizingPlayer, alpha = -Infinity, beta = Infinity) {
    if (this.shouldStop()) {
      return this.adapter.evaluate(state);
    }

    if (depth === 0 || this.adapter.isTerminal(state)) {
      return this.adapter.evaluate(state);
    }

    const moves = this.adapter.getPossibleMoves(state) || [];

    let value = isMaximizingPlayer ? -Infinity : Infinity;
    for (const move of moves) {
      if (this.shouldStop()) break;

      const newState = this.adapter.applyMove(state, move);
      const score = this.minimax(newState, depth - 1, !isMaximizingPlayer, alpha, beta);

      if (isMaximizingPlayer) {
        value = Math.max(value, score);
        alpha = Math.max(alpha, value);
      } else {
        value = Math.min(value, score);
        beta = Math.min(beta, value);
      }

      if (beta <= alpha) break;
    }
    return value;
  }
}

export class Strategy {
  constructor(adapter, maxDepth) {
    if (new.target === Strategy) {
      throw new Error('Strategy is abstract and cannot be instantiated directly.');
    }
    this.adapter = adapter;
    this.maxDepth = maxDepth;
  }

  findBestMove(state) {
    throw new Error('findBestMove must be implemented by subclasses');
  }
}

export class AlphaBetaStrategy extends Strategy {
  constructor(adapter, maxDepth) {
    super(adapter, maxDepth);
    this.engine = new AlphaBeta(adapter);
  }

  setDeadline(deadlineMs) {
    this.engine.setDeadline(deadlineMs);
  }

  findBestMove(state) {
    const moves = this.adapter.getPossibleMoves(state) || [];
    if (moves.length === 0) return null;

    let bestMove = null;
    let bestValue = -Infinity;
    let alpha = -Infinity;
    for (const move of moves) {
      if (this.engine.shouldStop()) break;
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

let state = new Uint16Array(24);
let board = new Uint8Array(BOARD_SIZE);

let searchRootIsFirstPlayer = true;

let lastExternalAction = null;
let sameMoveStreak = 0;

export async function setup(initialPositions, isFirstPlayer) {
  isFirstPlayerSelf = !!isFirstPlayer;

  swapCooldowns = [
    { sphinx: 0, pharaoh: 0 },
    { sphinx: 0, pharaoh: 0 },
  ];
  sphinxFiresThisTurn = true;

  const SELF_OFFSET = isFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  const OPP_OFFSET = isFirstPlayer ? PLAYER_B_OFFSET : PLAYER_A_OFFSET;

  board.fill(BOARD_EMPTY);

  {
    const sph = initialPositions.sphinx;
    const sphMirror = 99 - sph;
    const ph = initialPositions.pharaoh;
    const phMirror = 99 - ph;

    state[SELF_OFFSET + 0] = sph;
    state[OPP_OFFSET + 0] = sphMirror;
    board[getPosition(sph)] = SELF_OFFSET + 0;
    board[getPosition(sphMirror)] = OPP_OFFSET + 0;

    state[SELF_OFFSET + 1] = ph;
    state[OPP_OFFSET + 1] = phMirror;
    board[getPosition(ph)] = SELF_OFFSET + 1;
    board[getPosition(phMirror)] = OPP_OFFSET + 1;

    const phCol = getColumn(ph);
    state[SELF_OFFSET + 2]  = computeCoordinates(computePosition(5, phCol), 2);
    state[OPP_OFFSET + 2] = computeCoordinates(computePosition(6, 11 - phCol), 0);
    board[getPosition(state[SELF_OFFSET + 2])] = SELF_OFFSET + 2;
    board[getPosition(state[OPP_OFFSET + 2])] = OPP_OFFSET + 2;

    state[SELF_OFFSET + 3]  = computeCoordinates(computePosition(3, getColumn(sphMirror)), 2);
    state[OPP_OFFSET + 3] = computeCoordinates(computePosition(8, 11 - getColumn(sph)), 0);
    board[getPosition(state[SELF_OFFSET + 3])] = SELF_OFFSET + 3;
    board[getPosition(state[OPP_OFFSET + 3])] = OPP_OFFSET + 3;

    const sp = initialPositions.scarab.position;
    const so = initialPositions.scarab.orientation;
    state[SELF_OFFSET + 4]  = computeCoordinates(sp, shitDirection2Direction(so));
    state[OPP_OFFSET + 4] = computeCoordinates(99 - sp, shitDirection2Direction(9 - so));
    board[getPosition(state[SELF_OFFSET + 4])] = SELF_OFFSET + 4;
    board[getPosition(state[OPP_OFFSET + 4])] = OPP_OFFSET + 4;

    state.fill(PYRAMID_IN_RESERVE, SELF_OFFSET + 5, SELF_OFFSET + 12);
    state.fill(PYRAMID_IN_RESERVE, OPP_OFFSET + 5, OPP_OFFSET + 12);
  }

  return true;
}

const COOLDOWN_TURNS = 4;
let isFirstPlayerSelf = true;
let sphinxFiresThisTurn = true;

let swapCooldowns = [
  { sphinx: 0, pharaoh: 0 },
  { sphinx: 0, pharaoh: 0 },
];

const playerIndex = (isFirstPlayer) => (isFirstPlayer ? 0 : 1);

function reduceCooldownsForPlayer(pIdx) {
  swapCooldowns[pIdx].sphinx = Math.max(0, swapCooldowns[pIdx].sphinx - 1);
  swapCooldowns[pIdx].pharaoh = Math.max(0, swapCooldowns[pIdx].pharaoh - 1);
}

function applySwapSideEffects(move, sideIsFirstPlayer) {
  const pIdx = playerIndex(sideIsFirstPlayer);
  const targetLocal = move.targetId % PIECES_PER_PLAYER;

  if (targetLocal === 0) {
    swapCooldowns[pIdx].sphinx = COOLDOWN_TURNS;
    if (sideIsFirstPlayer === isFirstPlayerSelf) sphinxFiresThisTurn = false;
  }
  if (targetLocal === 1) {
    swapCooldowns[pIdx].pharaoh = COOLDOWN_TURNS;
  }
}

function rebuildBoardFromState(fromState) {
  board.fill(BOARD_EMPTY);
  for (let id = 0; id < fromState.length; id++) {
    const c = fromState[id];
    if (c === PYRAMID_IN_RESERVE) continue;
    const pos = getPosition(c);
    if (!isInBoard(pos)) continue;
    board[pos] = id;
  }
}

function applyMoveToState(fromState, move) {
  const newState = fromState.slice();

  switch (move.kind) {
    case 'rotate': {
      const piece = fromState[move.pieceId];
      newState[move.pieceId] = rotate(piece, !!move.rotateInverse);
      break;
    }
    case 'move': {
      const piece = fromState[move.pieceId];
      newState[move.pieceId] = computeCoordinates(move.to, getDirection(piece));
      break;
    }
    case 'place': {
      newState[move.pieceId] = computeCoordinates(move.to, move.placeDir ?? 0);
      break;
    }
    case 'swap': {
      const a = fromState[move.pieceId];
      const b = fromState[move.targetId];
      const aPos = getPosition(a);
      const bPos = getPosition(b);
      newState[move.pieceId] = computeCoordinates(bPos, getDirection(a));
      newState[move.targetId] = computeCoordinates(aPos, getDirection(b));
      break;
    }
    default:
      break;
  }

  const sideIsFirstPlayer = pieceOwnerOffset(move.pieceId) === PLAYER_A_OFFSET;
  applyLaserAfterMove(newState, sideIsFirstPlayer);

  return newState;
}

function fromExternalAction(action) {
  if (!action) return null;

  switch (action.action) {
    case 'ROTATE': {
      const pieceId = board[action.cell];
      if (pieceId === BOARD_EMPTY) return null;
      return /** @type {Move} */({
        kind: 'rotate',
        pieceId,
        rotateInverse: action.result === 'ANTICLOCKWISE',
      });
    }

    case 'MOVE': {
      const pieceId = board[action.cell];
      if (pieceId === BOARD_EMPTY) return null;
      return /** @type {Move} */({ kind: 'move', pieceId, to: action.result });
    }

    case 'PLACE': {
      const dest = action.result?.destination;
      const orient = action.result?.orientation;
      if (dest === undefined || orient === undefined) return null;
      return /** @type {Move} */({ kind: 'place', pieceId: -1, to: dest, placeDir: shitDirection2Direction(orient) });
    }

    case 'EXCHANGE': {
      const scarabId = board[action.cell];
      const targetId = board[action.result];
      if (scarabId === BOARD_EMPTY || targetId === BOARD_EMPTY) return null;
      return /** @type {Move} */({ kind: 'swap', pieceId: scarabId, targetId });
    }

    default:
      return null;
  }
}

function applyExternalAction(action, sideIsFirstPlayer) {
  if (!action) return;

  const normalized = (sideIsFirstPlayer ? action : {
    action: action.action,
    cell: mirrorCell(action.cell),
    result: (() => {
      switch (action.action) {
        case 'ROTATE':
          return mirrorRotationResult(action.result);
        case 'MOVE':
          return mirrorCell(action.result);
        case 'EXCHANGE':
          return mirrorCell(action.result);
        case 'PLACE':
          return {
            destination: mirrorCell(action.result.destination),
            orientation: mirrorOrientation(action.result.orientation),
          };
        default:
          return action.result;
      }
    })(),
  });

  rebuildBoardFromState(state);
  const move = fromExternalAction(normalized);
  if (!move) return;

  if (move.kind === 'place' && move.pieceId === -1) {
    const sideOffset = sideIsFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
    let chosen = -1;
    for (let local = 5; local < PIECES_PER_PLAYER; local++) {
      const id = sideOffset + local;
      if (state[id] === PYRAMID_IN_RESERVE) {
        chosen = id;
        break;
      }
    }
    if (chosen === -1) return;
    move.pieceId = chosen;
  }

  state = applyMoveToState(state, move);
  if (move.kind === 'swap') applySwapSideEffects(move, sideIsFirstPlayer);
  rebuildBoardFromState(state);
}

export async function nextMove(opponentAction) {
  const opponentIsFirstPlayer = !isFirstPlayerSelf;

  reduceCooldownsForPlayer(playerIndex(opponentIsFirstPlayer));

  if (opponentAction) {
    applyExternalAction(opponentAction, opponentIsFirstPlayer);
  }

  rebuildBoardFromState(state);

  reduceCooldownsForPlayer(playerIndex(isFirstPlayerSelf));
  sphinxFiresThisTurn = true;

  const selfOffset = isFirstPlayerSelf ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;

  const depth = chooseSearchDepth(state);
  const strat = new AlphaBetaStrategy(adapter, depth);

  searchRootIsFirstPlayer = isFirstPlayerSelf;
  state.__depth = depth;
  state.__maxDepth = depth;

  const deadlineMs = Date.now() + 190;
  strat.setDeadline(deadlineMs);

  const myMove = strat.findBestMove(state) ?? /** @type {Move} */({ kind: 'rotate', pieceId: selfOffset + 0, rotateInverse: false });

  delete state.__depth;
  delete state.__maxDepth;

  const externalAction = toExternalAction(myMove);

  if (lastExternalAction && JSON.stringify(lastExternalAction) === JSON.stringify(externalAction)) sameMoveStreak++;
  else sameMoveStreak = 0;
  lastExternalAction = externalAction;

  state = applyMoveToState(state, myMove);
  if (myMove.kind === 'swap') applySwapSideEffects(myMove, isFirstPlayerSelf);

  rebuildBoardFromState(state);

  return externalAction;
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

function toExternalAction(move) {
  const currentCell = getPosition(state[move.pieceId]);

  const base = (() => {
    switch (move.kind) {
      case 'rotate':
        return {
          action: 'ROTATE',
          cell: currentCell,
          result: move.rotateInverse ? 'ANTICLOCKWISE' : 'CLOCKWISE',
        };

      case 'move':
        return {
          action: 'MOVE',
          cell: currentCell,
          result: move.to,
        };

      case 'place': {
        const selfOffset = isFirstPlayerSelf ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
        const safeCell = getPosition(state[selfOffset + 1]);
        return {
          action: 'PLACE',
          cell: safeCell,
          result: {
            destination: move.to,
            orientation: direction2ShitDirection(move.placeDir ?? 0),
          },
        };
      }

      case 'swap':
        return {
          action: 'EXCHANGE',
          cell: currentCell,
          result: getPosition(state[move.targetId]),
        };

      default:
        throw new Error(`Unsupported move kind: ${move.kind}`);
    }
  })();

  if (!isFirstPlayerSelf) {
    return {
      action: base.action,
      cell: mirrorCell(base.cell),
      result: (() => {
        switch (base.action) {
          case 'ROTATE':
            return mirrorRotationResult(base.result);
          case 'MOVE':
            return mirrorCell(base.result);
          case 'EXCHANGE':
            return mirrorCell(base.result);
          case 'PLACE':
            return {
              destination: mirrorCell(base.result.destination),
              orientation: mirrorOrientation(base.result.orientation),
            };
          default:
            return base.result;
        }
      })(),
    };
  }

  return base;
}

const rotate = (piece, inverse = false) => computeCoordinates(getPosition(piece), (getDirection(piece) + (inverse ? 3 : 1)) % 4);
const isInBoard = (position) => position >= 0 && position < BOARD_SIZE;
const isLegalMove = (to) => isInBoard(to) && isEmpty(to);

const isEmpty = (position) => isInBoard(position) && board[position] === BOARD_EMPTY;

const isOrthogonalNeighbor = (from, to) => {
  if (!isInBoard(from) || !isInBoard(to)) return false;
  if ((from / 10 | 0) === (to / 10 | 0)) {
    return Math.abs((from % 10) - (to % 10)) === 1;
  }
  if ((from % 10) === (to % 10)) {
    return Math.abs((from / 10 | 0) - (to / 10 | 0)) === 1;
  }
  return false;
};

const countEmptyOrthogonalMoves = (pos, bcache) => {
  let n = 0;
  const p1 = pos + 1;
  if (isOrthogonalNeighbor(pos, p1) && isInBoard(p1) && bcache[p1] === BOARD_EMPTY) n++;
  const p2 = pos - 1;
  if (isOrthogonalNeighbor(pos, p2) && isInBoard(p2) && bcache[p2] === BOARD_EMPTY) n++;
  const p3 = pos + 10;
  if (isOrthogonalNeighbor(pos, p3) && isInBoard(p3) && bcache[p3] === BOARD_EMPTY) n++;
  const p4 = pos - 10;
  if (isOrthogonalNeighbor(pos, p4) && isInBoard(p4) && bcache[p4] === BOARD_EMPTY) n++;
  return n;
};

function isTerminalState(s) {
  const aPh = s[PLAYER_A_OFFSET + 1];
  const bPh = s[PLAYER_B_OFFSET + 1];
  const aAlive = aPh !== PYRAMID_IN_RESERVE && isInBoard(getPosition(aPh));
  const bAlive = bPh !== PYRAMID_IN_RESERVE && isInBoard(getPosition(bPh));
  return !(aAlive && bAlive);
}

function* generateMoveActions(isFirstPlayer) {
  rebuildBoardFromState(state);

  const SELF_OFFSET = isFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;

  {
    const id = SELF_OFFSET + 0;
    yield /** @type {Move} */({ kind: 'rotate', pieceId: id, rotateInverse: false });
    yield /** @type {Move} */({ kind: 'rotate', pieceId: id, rotateInverse: true });
  }

  yield* generateRotateAndStepActions(SELF_OFFSET + 1);
  yield* generateRotateAndStepActions(SELF_OFFSET + 2);
  yield* generateRotateAndStepActions(SELF_OFFSET + 3);
  yield* generateRotateAndStepActions(SELF_OFFSET + 4);

  {
    const scarabId = SELF_OFFSET + 4;
    const cds = swapCooldowns[playerIndex(isFirstPlayer)];
    if (cds.sphinx === 0) yield /** @type {Move} */({ kind: 'swap', pieceId: scarabId, targetId: SELF_OFFSET + 0 });
    if (cds.pharaoh === 0) yield /** @type {Move} */({ kind: 'swap', pieceId: scarabId, targetId: SELF_OFFSET + 1 });
  }

  for (let local = 5; local < PIECES_PER_PLAYER; local++) {
    const id = SELF_OFFSET + local;
    const p = state[id];

    if (p === PYRAMID_IN_RESERVE) {
      for (let pos = 0; pos < BOARD_SIZE; pos++) {
        if (!isLegalPyramidSpawnCell(pos, isFirstPlayer)) continue;
        for (let dir = 0; dir < 4; dir++) {
          yield /** @type {Move} */({ kind: 'place', pieceId: id, to: pos, placeDir: dir });
        }
      }
    } else {
      yield* generateRotateAndStepActions(id);
    }
  }
}

function* generateRotateAndStepActions(pieceId) {
  const piece = state[pieceId];
  const pos = getPosition(piece);

  yield /** @type {Move} */({ kind: 'rotate', pieceId, rotateInverse: false });
  yield /** @type {Move} */({ kind: 'rotate', pieceId, rotateInverse: true });

  const candidates = [
    pos + 1,
    pos - 1,
    computePosition(getLine(piece) + 1, getColumn(piece)),
    computePosition(getLine(piece) - 1, getColumn(piece)),
  ];

  for (const np of candidates) {
    if (!isOrthogonalNeighbor(pos, np)) continue;
    if (!isLegalMove(np)) continue;
    yield /** @type {Move} */({ kind: 'move', pieceId, to: np });
  }
}

const MAX_MOVES_TOTAL = 40;
const MAX_PLACE_MOVES = 10;

const adapter = {
  getPossibleMoves(currentState) {
    const savedState = state;
    const savedBoard = board.slice();
    try {
      state = currentState;
      rebuildBoardFromState(state);

      const isFirst = this.getCurrentPlayer(state);
      const moves = Array.from(generateMoveActions(isFirst));

      const scored = [];
      for (const m of moves) {
        const ns = applyMoveToState(state, m);
        const s = evaluateStateMinimal(ns);
        scored.push({ m, s });
      }

      scored.sort((a, b) => wantMax ? (b.s - a.s) : (a.s - b.s));

      const result = [];
      let placeCount = 0;

      for (const { m } of scored) {
        if (result.length >= MAX_MOVES_TOTAL) break;
        if (m.kind === 'place') {
          if (placeCount >= MAX_PLACE_MOVES) continue;
          placeCount++;
        }
        result.push(m);
      }

      return result;
    } finally {
      state = savedState;
      board = savedBoard;
    }
  },

  applyMove(currentState, move) {
    const savedState = state;
    const savedBoard = board.slice();
    try {
      state = currentState;
      rebuildBoardFromState(state);

      const next = applyMoveToState(state, move);
      if (currentState && typeof currentState.__depth === 'number') {
        next.__depth = currentState.__depth - 1;
      }
      return next;
    } finally {
      state = savedState;
      board = savedBoard;
    }
  },

  isTerminal(currentState) {
    return isTerminalState(currentState);
  },

  evaluate(currentState) {
    return evaluate(currentState, searchRootIsFirstPlayer);
  },

  getCurrentPlayer(currentState) {
    const d = currentState && typeof currentState.__depth === 'number' ? currentState.__depth : 0;
    const maxD = currentState && typeof currentState.__maxDepth === 'number' ? currentState.__maxDepth : d;
    const plyFromRoot = (maxD - d) | 0;
    return (plyFromRoot % 2 === 0) ? searchRootIsFirstPlayer : !searchRootIsFirstPlayer;
  },
};

const LOCAL_SPHINX = 0;
const LOCAL_PHARAOH = 1;

const DIR_DELTAS = [
  { dc: 1, dr: 0 },
  { dc: 0, dr: 1 },
  { dc: -1, dr: 0 },
  { dc: 0, dr: -1 },
];

function cellToRC(cell) {
  return { r: (cell / 10) | 0, c: cell % 10 };
}

function rcToCell(r, c) {
  return r * 10 + c;
}

function inBoardRC(r, c) {
  return r >= 0 && r < 10 && c >= 0 && c < 10;
}

function pieceLocalIndex(pieceId) {
  return pieceId % PIECES_PER_PLAYER;
}

function pieceOwnerOffset(pieceId) {
  return pieceId < PLAYER_B_OFFSET ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
}

function capturePiece(stateArr, pieceId) {
  stateArr[pieceId] = PYRAMID_IN_RESERVE;
}

function reflectLaser(local, incomingDir, pieceDir) {
  switch (local) {
    case 4: {
      const isBackSlash = (pieceDir === 0 || pieceDir === 2);
      if (isBackSlash) {
        if (incomingDir === 0) return 1;
        if (incomingDir === 1) return 0;
        if (incomingDir === 2) return 3;
        return 2;
      }
      if (incomingDir === 0) return 3;
      if (incomingDir === 3) return 0;
      if (incomingDir === 2) return 1;
      return 2;
    }

    case 5: case 6: case 7: case 8: case 9: case 10: case 11: {
      const isBackSlash = (pieceDir === 0 || pieceDir === 2);
      if (isBackSlash) {
        if (incomingDir === 0) return 1;
        if (incomingDir === 1) return 0;
        return -1;
      } else {
        if (incomingDir === 0) return 3;
        if (incomingDir === 3) return 0;
        return -1;
      }
    }

    case 2: case 3: {
      const hitFromFront = pieceDir === ((incomingDir + 2) & 3);
      return hitFromFront ? -2 : -1;
    }

    case 0: {
      return -2;
    }

    case 1: {
      return -1;
    }

    default:
      return -1;
  }
}

function applyLaserAfterMove(stateArr, sideIsFirstPlayer) {
  if (sideIsFirstPlayer === isFirstPlayerSelf && sphinxFiresThisTurn === false) return;

  const btmp = new Uint8Array(BOARD_SIZE);
  btmp.fill(BOARD_EMPTY);
  for (let id = 0; id < stateArr.length; id++) {
    const c = stateArr[id];
    if (c === PYRAMID_IN_RESERVE) continue;
    const pos = getPosition(c);
    if (!isInBoard(pos)) continue;
    btmp[pos] = id;
  }

  const offset = sideIsFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  const sphCoord = stateArr[offset + LOCAL_SPHINX];
  if (sphCoord === PYRAMID_IN_RESERVE) return;
  const sphPos = getPosition(sphCoord);
  const sphDir = getDirection(sphCoord) & 3;

  let { r, c } = cellToRC(sphPos);
  let dir = sphDir;

  for (let step = 0; step < 100; step++) {
    const d = DIR_DELTAS[dir];
    r += d.dr;
    c += d.dc;
    if (!inBoardRC(r, c)) break;

    const cell = rcToCell(r, c);
    const pid = btmp[cell];
    if (pid === BOARD_EMPTY) continue;

    const local = pieceLocalIndex(pid);
    const pc = stateArr[pid];
    const pdir = getDirection(pc) & 3;

    const refl = reflectLaser(local, dir, pdir);
    if (refl === -2) break;
    if (refl === -1) {
      capturePiece(stateArr, pid);
      break;
    }
    dir = refl;
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

function getDirection(coordinates){
  return coordinates >> COORD_DIRECTION_SHIFT;
}

function getPosition(coordinates){
  return coordinates & COORD_POSITION_MASK;
}

function mirrorCell(cell) {
  return 99 - cell;
}

function mirrorRotationResult(result) {
  if (result === 'CLOCKWISE') return 'ANTICLOCKWISE';
  if (result === 'ANTICLOCKWISE') return 'CLOCKWISE';
  return result;
}

function mirrorOrientation(orientation) {
  if (orientation === 0) return 99;
  if (orientation === 99) return 0;
  if (orientation === 9) return 90;
  if (orientation === 90) return 9;
  return orientation;
}

function countReservePyramids(forFirstPlayer, s) {
  const off = forFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  let n = 0;
  for (let local = 5; local < PIECES_PER_PLAYER; local++) {
    if (s[off + local] === PYRAMID_IN_RESERVE) n++;
  }
  return n;
}

function chooseSearchDepth(s) {
  const selfReserve = countReservePyramids(isFirstPlayerSelf, s);
  const oppReserve = countReservePyramids(!isFirstPlayerSelf, s);
  const totalReserve = selfReserve + oppReserve;

  if (totalReserve >= 10) return 3;
  if (totalReserve >= 6) return 4;
  if (totalReserve >= 2) return 5;
  return 6;
}

function isLegalPyramidSpawnCell(position, isFirstPlayer) {
  if (!isInBoard(position) || !isEmpty(position)) return false;

  const selfOffset = isFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;

  const n0 = position + 1;
  if (isOrthogonalNeighbor(position, n0)) {
    const pid = board[n0];
    if (pid !== BOARD_EMPTY) {
      const localIndex = pid % PIECES_PER_PLAYER;
      if (localIndex === 0) return false;
      if (localIndex === 1 && pid >= selfOffset && pid < selfOffset + PIECES_PER_PLAYER) return false;
    }
  }

  const n1 = position - 1;
  if (isOrthogonalNeighbor(position, n1)) {
    const pid = board[n1];
    if (pid !== BOARD_EMPTY) {
      const localIndex = pid % PIECES_PER_PLAYER;
      if (localIndex === 0) return false;
      if (localIndex === 1 && pid >= selfOffset && pid < selfOffset + PIECES_PER_PLAYER) return false;
    }
  }

  const n2 = position + 10;
  if (isOrthogonalNeighbor(position, n2)) {
    const pid = board[n2];
    if (pid !== BOARD_EMPTY) {
      const localIndex = pid % PIECES_PER_PLAYER;
      if (localIndex === 0) return false;
      if (localIndex === 1 && pid >= selfOffset && pid < selfOffset + PIECES_PER_PLAYER) return false;
    }
  }

  const n3 = position - 10;
  if (isOrthogonalNeighbor(position, n3)) {
    const pid = board[n3];
    if (pid !== BOARD_EMPTY) {
      const localIndex = pid % PIECES_PER_PLAYER;
      if (localIndex === 0) return false;
      if (localIndex === 1 && pid >= selfOffset && pid < selfOffset + PIECES_PER_PLAYER) return false;
    }
  }

  return true;
}

const __evalBoard = new Uint8Array(BOARD_SIZE);
const __evalHitListA = new Int16Array(24);
const __evalHitListB = new Int16Array(24);
const __laserMark = new Int8Array(24);
const __traceOutA = new Int16Array(2);
const __traceOutB = new Int16Array(2);

function buildBoardNoAlloc(s, outBoard) {
  outBoard.fill(BOARD_EMPTY);
  for (let id = 0; id < s.length; id++) {
    const c = s[id];
    if (c === PYRAMID_IN_RESERVE) continue;
    const pos = getPosition(c);
    if (!isInBoard(pos)) continue;
    outBoard[pos] = id;
  }
}

function traceLaserToOut2(s, bcache, sideIsFirstPlayer, outHits, mark, out2) {
  mark.fill(0);

  let reflections = 0;
  let hitCount = 0;

  const offset = sideIsFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  const sphCoord = s[offset + LOCAL_SPHINX];
  if (sphCoord === PYRAMID_IN_RESERVE) {
    out2[0] = -1;
    out2[1] = 0;
    return;
  }

  const sphPos = getPosition(sphCoord);
  let { r, c } = cellToRC(sphPos);
  let dir = getDirection(sphCoord) & 3;

  for (let step = 0; step < 100; step++) {
    const d = DIR_DELTAS[dir];
    r += d.dr;
    c += d.dc;

    if (!inBoardRC(r, c)) {
      out2[0] = -1;
      out2[1] = reflections;
      return;
    }

    const cell = rcToCell(r, c);
    const pid = bcache[cell];
    if (pid === BOARD_EMPTY) continue;

    if (mark[pid] === 0) {
      mark[pid] = 1;
      outHits[hitCount++] = pid;
    }

    const local = pieceLocalIndex(pid);
    const pc = s[pid];
    const pdir = getDirection(pc) & 3;

    const refl = reflectLaser(local, dir, pdir);
    if (refl === -2) {
      out2[0] = -1;
      out2[1] = reflections;
      return;
    }
    if (refl === -1) {
      out2[0] = pid;
      out2[1] = reflections;
      return;
    }

    reflections++;
    dir = refl;
  }

  out2[0] = -1;
  out2[1] = reflections;
}

function countLegalMovesFast(s, bcache, sideIsFirstPlayer) {
  const SELF_OFFSET = sideIsFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  let n = 0;

  n += 2;

  for (let local = 1; local <= 4; local++) {
    const id = SELF_OFFSET + local;
    const coord = s[id];
    if (coord === PYRAMID_IN_RESERVE) continue;
    const pos = getPosition(coord);
    if (!isInBoard(pos)) continue;

    n += 2;

    n += countEmptyOrthogonalMoves(pos, bcache);
  }

  const MAX_PLACE_SAMPLES = 12;
  let placeSamples = 0;

  for (let local = 5; local < PIECES_PER_PLAYER; local++) {
    const id = SELF_OFFSET + local;
    const coord = s[id];

    if (coord === PYRAMID_IN_RESERVE) {
      if (placeSamples >= MAX_PLACE_SAMPLES) continue;

      for (let cell = 0; cell < BOARD_SIZE && placeSamples < MAX_PLACE_SAMPLES; cell++) {
        if (bcache[cell] !== BOARD_EMPTY) continue;
        if (!isLegalPyramidSpawnCell(cell, sideIsFirstPlayer)) continue;
        n += 4;
        placeSamples++;
      }
      continue;
    }

    const pos = getPosition(coord);
    if (!isInBoard(pos)) continue;

    n += 2;
    n += countEmptyOrthogonalMoves(pos, bcache);
  }

  return n;
}

export function evaluate(s, me) {
  const myOff = me ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  const oppOff = me ? PLAYER_B_OFFSET : PLAYER_A_OFFSET;

  const myPh = s[myOff + LOCAL_PHARAOH];
  const oppPh = s[oppOff + LOCAL_PHARAOH];

  const myAlive = myPh !== PYRAMID_IN_RESERVE && isInBoard(getPosition(myPh));
  const oppAlive = oppPh !== PYRAMID_IN_RESERVE && isInBoard(getPosition(oppPh));

  if (myAlive && !oppAlive) return 100000;
  if (!myAlive && oppAlive) return -100000;
  if (!myAlive && !oppAlive) return 0;

  buildBoardNoAlloc(s, __evalBoard);

  const meIsFirst = !!me;
  const oppIsFirst = !meIsFirst;

  traceLaserToOut2(s, __evalBoard, meIsFirst, __evalHitListA, __laserMark, __traceOutA);
  traceLaserToOut2(s, __evalBoard, oppIsFirst, __evalHitListB, __laserMark, __traceOutB);

  const meFirstHitId = __traceOutA[0];
  const meReflections = __traceOutA[1];
  const oppFirstHitId = __traceOutB[0];
  const oppReflections = __traceOutB[1];

  let pharaohThreat = 0;
  if (meFirstHitId !== -1 && meFirstHitId === (oppOff + LOCAL_PHARAOH)) pharaohThreat += 1;
  if (oppFirstHitId !== -1 && oppFirstHitId === (myOff + LOCAL_PHARAOH)) pharaohThreat -= 1;

  const myPhPos = getPosition(myPh);
  const oppPhPos = getPosition(oppPh);

  const protectionBonusNoAlloc = (phPos, ownerOff) => {
    let bonus = 0;
    const n0 = phPos + 1;
    if (isOrthogonalNeighbor(phPos, n0)) {
      const pid = __evalBoard[n0];
      if (pid !== BOARD_EMPTY && pid >= ownerOff && pid < ownerOff + PIECES_PER_PLAYER) bonus++;
    }
    const n1 = phPos - 1;
    if (isOrthogonalNeighbor(phPos, n1)) {
      const pid = __evalBoard[n1];
      if (pid !== BOARD_EMPTY && pid >= ownerOff && pid < ownerOff + PIECES_PER_PLAYER) bonus++;
    }
    const n2 = phPos + 10;
    if (isOrthogonalNeighbor(phPos, n2)) {
      const pid = __evalBoard[n2];
      if (pid !== BOARD_EMPTY && pid >= ownerOff && pid < ownerOff + PIECES_PER_PLAYER) bonus++;
    }
    const n3 = phPos - 10;
    if (isOrthogonalNeighbor(phPos, n3)) {
      const pid = __evalBoard[n3];
      if (pid !== BOARD_EMPTY && pid >= ownerOff && pid < ownerOff + PIECES_PER_PLAYER) bonus++;
    }
    return bonus;
  };

  const myProt = protectionBonusNoAlloc(myPhPos, myOff);
  const oppProt = protectionBonusNoAlloc(oppPhPos, oppOff);
  const pharaohProtectionTerm = (myProt - oppProt) * 0.05;

  let laserPressure = 0;
  if (meFirstHitId !== -1) {
    const isOppPiece = pieceOwnerOffset(meFirstHitId) === oppOff;
    if (isOppPiece) laserPressure += 1;
  }
  if (oppFirstHitId !== -1) {
    const isMyPiece = pieceOwnerOffset(oppFirstHitId) === myOff;
    if (isMyPiece) laserPressure -= 1;
  }

  if (meReflections >= 2) laserPressure += 0.25;
  if (oppReflections >= 2) laserPressure -= 0.25;

  const myMob = countLegalMovesFast(s, __evalBoard, meIsFirst);
  const oppMob = countLegalMovesFast(s, __evalBoard, oppIsFirst);
  const mobility = myMob - oppMob;

  let centerControl = 0;
  for (let id = 0; id < s.length; id++) {
    const coord = s[id];
    if (coord === PYRAMID_IN_RESERVE) continue;
    const pos = getPosition(coord);
    if (!isInBoard(pos)) continue;
    const r = (pos / 10) | 0;
    const c = pos % 10;
    if (r < 3 || r > 6 || c < 3 || c > 6) continue;

    const isMine = id >= myOff && id < myOff + PIECES_PER_PLAYER;
    centerControl += isMine ? 1 : -1;
  }

  return (
    9000 * (pharaohThreat + pharaohProtectionTerm)
    + 40 * (laserPressure)
    + 3 * (mobility)
    + 5 * (centerControl)
  );
}

