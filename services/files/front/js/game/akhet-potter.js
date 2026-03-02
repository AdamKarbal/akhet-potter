/* ============================================================
   Khet AI — FIXED v2
   Additional fixes over v1:
   - Streak detection uses board-state hashing (catches CW↔ACW oscillation)
   - Oscillation ban covers both rotation directions on the piece
   - Repetition penalty raised to -20000
   ============================================================ */

export const BOARD_SIZE = 100;
export const BOARD_EMPTY = 255;
export const COORD_POSITION_MASK = 0xff;
export const COORD_DIRECTION_SHIFT = 8;
export const PIECES_PER_PLAYER = 12;
export const PLAYER_A_OFFSET = 0;
export const PLAYER_B_OFFSET = PIECES_PER_PLAYER;
export const PYRAMID_IN_RESERVE = 0xffff;

/* WeakMap depth tracking (Fix 1 from v1) */
const stateDepthMap = new WeakMap();
const stateMaxDepthMap = new WeakMap();
function setStateDepth(s, depth, maxDepth) { stateDepthMap.set(s, depth); stateMaxDepthMap.set(s, maxDepth); }
function getStateDepth(s) { return stateDepthMap.get(s) ?? 0; }
function getStateMaxDepth(s) { return stateMaxDepthMap.get(s) ?? getStateDepth(s); }

/* Repetition ring */
const REP_WINDOW = 20;
const repRing = new BigInt64Array(REP_WINDOW);
let repIdx = 0;
let repFilled = 0;
function repPush(hash) {
  repRing[repIdx] = hash;
  repIdx = (repIdx + 1) % REP_WINDOW;
  if (repFilled < REP_WINDOW) repFilled++;
}
function repCount(hash) {
  let c = 0;
  for (let i = 0; i < repFilled; i++) if (repRing[i] === hash) c++;
  return c;
}

/* TT + Zobrist */
const TT_FLAG = { EXACT: 0, LOWERBOUND: 1, UPPERBOUND: 2 };
const ttMap = new Map();
const TT_MAX = 200000;
let __zseed = 0x12345678 | 0;
function __rnd32() {
  __zseed ^= (__zseed << 13); __zseed |= 0;
  __zseed ^= (__zseed >>> 17); __zseed |= 0;
  __zseed ^= (__zseed << 5); __zseed |= 0;
  return (__zseed >>> 0);
}
function __rnd64() { return (BigInt(__rnd32()) << 32n) ^ BigInt(__rnd32()); }
const ZOBRIST_POS = (() => { const r = new Array(24); for (let p = 0; p < 24; p++) { r[p] = new Array(100); for (let i = 0; i < 100; i++) r[p][i] = __rnd64(); } return r; })();
const ZOBRIST_DIR = (() => { const r = new Array(24); for (let p = 0; p < 24; p++) { r[p] = new Array(4); for (let d = 0; d < 4; d++) r[p][d] = __rnd64(); } return r; })();
const ZOBRIST_TURN = __rnd64();

function computeHash(s, sideToPlayIsFirst = false) {
  let h = 0n;
  for (let id = 0; id < s.length; id++) {
    const c = s[id];
    if (c === PYRAMID_IN_RESERVE) continue;
    const pos = getPosition(c);
    if (pos < 0 || pos >= 100) continue;
    h ^= ZOBRIST_POS[id][pos];
    h ^= ZOBRIST_DIR[id][getDirection(c) & 3];
  }
  if (sideToPlayIsFirst) h ^= ZOBRIST_TURN;
  return h;
}

function ttProbe(key, depth, alpha, beta) {
  const e = ttMap.get(key);
  if (!e || e.depth < depth) return null;
  if (e.flag === TT_FLAG.EXACT) return e.score;
  if (e.flag === TT_FLAG.LOWERBOUND && e.score >= beta) return e.score;
  if (e.flag === TT_FLAG.UPPERBOUND && e.score <= alpha) return e.score;
  return null;
}
function ttStore(key, depth, score, flag, bestMove) {
  if (ttMap.size > TT_MAX) ttMap.clear();
  const prev = ttMap.get(key);
  if (!prev || depth >= prev.depth) ttMap.set(key, { depth, score, flag, bestMove });
}
function movesEqual(a, b) {
  if (!a || !b || a.kind !== b.kind || a.pieceId !== b.pieceId) return false;
  switch (a.kind) {
    case 'rotate': return !!a.rotateInverse === !!b.rotateInverse;
    case 'move': return a.to === b.to;
    case 'place': return a.to === b.to && (a.placeDir ?? 0) === (b.placeDir ?? 0);
    case 'swap': return a.targetId === b.targetId;
    default: return false;
  }
}

/* Board/state pool */
const __BOARD_STACK_MAX = 512;
const __boardStack = new Array(__BOARD_STACK_MAX);
for (let i = 0; i < __BOARD_STACK_MAX; i++) __boardStack[i] = new Uint8Array(BOARD_SIZE);
let __boardSp = 0;
function __boardPush() { if (__boardSp >= __BOARD_STACK_MAX) __boardSp = __BOARD_STACK_MAX - 1; __boardStack[__boardSp++].set(board); }
function __boardPop() { if (__boardSp > 0) board.set(__boardStack[--__boardSp]); }

const __STATE_POOL_MAX = 8192;
const __statePool = new Array(__STATE_POOL_MAX);
for (let i = 0; i < __STATE_POOL_MAX; i++) __statePool[i] = new Uint16Array(24);
let __stateSp = 0;
function __allocStateFrom(s) { if (__stateSp >= __STATE_POOL_MAX) return s.slice(); const o = __statePool[__stateSp++]; o.set(s); return o; }
function __resetStatePool() { __stateSp = 0; }

/* Search */
export class Minimax {
  constructor(adapter) { this.adapter = adapter; this.deadlineMs = Infinity; this.stopBufferMs = 5; }
  setDeadline(ms) { this.deadlineMs = ms ?? Infinity; }
  shouldStop() { return Date.now() >= (this.deadlineMs - this.stopBufferMs); }
  minimax(state, depth, isMax, alpha = -Infinity, beta = Infinity) {
    if (this.shouldStop() || depth === 0 || this.adapter.isTerminal(state)) return this.adapter.evaluate(state);
    let value = isMax ? -Infinity : Infinity;
    for (const move of (this.adapter.getPossibleMoves(state) || [])) {
      if (this.shouldStop()) break;
      const score = this.minimax(this.adapter.applyMove(state, move), depth - 1, !isMax, alpha, beta);
      if (isMax) { value = Math.max(value, score); alpha = Math.max(alpha, value); }
      else { value = Math.min(value, score); beta = Math.min(beta, value); }
    }
    return value;
  }
}

export class AlphaBeta extends Minimax {
  constructor(adapter) { super(adapter); this.killers = new Array(256).fill(null).map(() => []); }

  minimax(state, depth, isMax, alpha = -Infinity, beta = Infinity, ply = 0, pathHashes = null) {
    if (this.shouldStop()) return this.adapter.evaluate(state);

    const side = this.adapter.getCurrentPlayer(state);
    const key = computeHash(state, side);

    if (pathHashes && pathHashes.has(key)) return 0; // draw by repetition on path

    if (depth === 0 || this.adapter.isTerminal(state)) return this.adapter.evaluate(state);

    const alpha0 = alpha, beta0 = beta;
    const probe = ttProbe(key, depth, alpha, beta);
    if (probe !== null) return probe;

    if (pathHashes) pathHashes.add(key);

    let value = isMax ? -Infinity : Infinity;
    let bestMove = null;
    const moves = this.adapter.getPossibleMoves(state) || [];

    const ttNode = ttMap.get(key);
    if (ttNode?.bestMove) {
      for (let i = 0; i < moves.length; i++) {
        if (movesEqual(moves[i], ttNode.bestMove)) { moves.unshift(moves.splice(i, 1)[0]); break; }
      }
    }
    const kp = this.killers[ply] || [];
    for (let k = kp.length - 1; k >= 0; k--) {
      for (let i = 0; i < moves.length; i++) {
        if (movesEqual(moves[i], kp[k])) { moves.unshift(moves.splice(i, 1)[0]); break; }
      }
    }

    for (let i = 0; i < moves.length; i++) {
      if (this.shouldStop()) break;
      const score = this.minimax(this.adapter.applyMove(state, moves[i]), depth - 1, !isMax, alpha, beta, ply + 1, pathHashes);
      if (isMax) { if (score > value) { value = score; bestMove = moves[i]; } alpha = Math.max(alpha, value); }
      else { if (score < value) { value = score; bestMove = moves[i]; } beta = Math.min(beta, value); }
      if (beta <= alpha) {
        const ktab = this.killers[ply] || (this.killers[ply] = []);
        if (!ktab.some(k => movesEqual(k, moves[i]))) { ktab.unshift(moves[i]); if (ktab.length > 2) ktab.length = 2; }
        break;
      }
    }

    if (pathHashes) pathHashes.delete(key);

    ttStore(key, depth, value,
      value <= alpha0 ? TT_FLAG.UPPERBOUND : value >= beta0 ? TT_FLAG.LOWERBOUND : TT_FLAG.EXACT,
      bestMove);
    return value;
  }
}

export class Strategy {
  constructor(adapter, maxDepth) {
    if (new.target === Strategy) throw new Error('abstract');
    this.adapter = adapter; this.maxDepth = maxDepth;
  }
  findBestMove(_) { throw new Error('implement'); }
}

export class AlphaBetaStrategy extends Strategy {
  constructor(adapter, maxDepth) {
    super(adapter, maxDepth);
    this.engine = new AlphaBeta(adapter);
    this.aspirationWindow = 50;
  }
  setDeadline(ms) { this.engine.setDeadline(ms); }

  findBestMove(state, rootIsFirst = true, bannedPieceIds = new Set()) {
    const prevRoot = this.adapter.__rootIsFirstPlayer;
    this.adapter.__rootIsFirstPlayer = !!rootIsFirst;
    let bestMove = null, prevScore = 0;

    try {
      for (let depth = 1; depth <= this.maxDepth; depth++) {
        if (this.engine.shouldStop()) break;
        setStateDepth(state, depth, depth);

        let moves = this.adapter.getPossibleMoves(state) || [];
        if (!moves.length) break;

        // FIX: ban oscillating pieces entirely from consideration
        if (bannedPieceIds.size > 0) {
          const filtered = moves.filter(mv => !bannedPieceIds.has(mv.pieceId) || mv.kind !== 'rotate');
          if (filtered.length > 0) moves = filtered;
        }

        const rootSide = this.adapter.getCurrentPlayer(state);
        const rootKey = computeHash(state, rootSide);
        const ttNode = ttMap.get(rootKey);
        if (ttNode?.bestMove) {
          for (let i = 0; i < moves.length; i++) {
            if (movesEqual(moves[i], ttNode.bestMove)) { moves.unshift(moves.splice(i, 1)[0]); break; }
          }
        }

        let alpha = prevScore - Math.max(20, this.aspirationWindow);
        const beta = prevScore + Math.max(20, this.aspirationWindow);
        let localBest = null, localBestScore = -Infinity;
        const pathHashes = new Set([rootKey]);

        for (let i = 0; i < moves.length; i++) {
          if (this.engine.shouldStop()) break;
          const ns = this.adapter.applyMove(state, moves[i]);
          let score = this.engine.minimax(ns, depth - 1, false, alpha, beta, 1, pathHashes);
          if (score <= alpha || score >= beta)
            score = this.engine.minimax(ns, depth - 1, false, -Infinity, Infinity, 1, pathHashes);
          if (score > localBestScore) { localBestScore = score; localBest = moves[i]; alpha = Math.max(alpha, score); }
        }

        if (localBest) { bestMove = localBest; prevScore = Math.trunc(localBestScore || 0); }
        if (this.engine.shouldStop()) break;
      }
      return bestMove;
    } finally {
      if (prevRoot === undefined) delete this.adapter.__rootIsFirstPlayer;
      else this.adapter.__rootIsFirstPlayer = prevRoot;
    }
  }
}

/* Global state */
let state = new Uint16Array(24);
let board = new Uint8Array(BOARD_SIZE);
let searchRootIsFirstPlayer = true;

const COOLDOWN_TURNS = 4;
let isFirstPlayerSelf = true;
let sphinxFiresThisTurn = true;
let swapCooldowns = [{ sphinx: 0, pharaoh: 0 }, { sphinx: 0, pharaoh: 0 }];

// FIX v2: oscillation tracking via board-state hashes
const RECENT_HASHES_SIZE = 8;
const recentBoardHashes = new Array(RECENT_HASHES_SIZE).fill(0n);
let recentHashIdx = 0;
let recentHashFilled = 0;

function pushRecentHash(h) {
  recentBoardHashes[recentHashIdx] = h;
  recentHashIdx = (recentHashIdx + 1) % RECENT_HASHES_SIZE;
  if (recentHashFilled < RECENT_HASHES_SIZE) recentHashFilled++;
}

// Returns pieceIds that are causing oscillation (their position appears 2+ times in recent 6 hashes)
function detectOscillatingPieces(currentState) {
  const currentHash = computeHash(currentState, isFirstPlayerSelf);
  // Check if this exact board state appeared 2 or 4 turns ago (oscillation period 2)
  let count = 0;
  for (let i = 0; i < recentHashFilled; i++) if (recentBoardHashes[i] === currentHash) count++;
  if (count < 1) return new Set();

  // Find which piece(s) are rotating back and forth by checking all pieces
  const selfOffset = isFirstPlayerSelf ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  const banned = new Set();
  // Ban any piece that's been at the same position for the last 4 turns
  // (meaning all moves were on other pieces or reversing rotations)
  for (let local = 0; local < PIECES_PER_PLAYER; local++) {
    banned.add(selfOffset + local);
  }
  return banned; // ban all rotations to force a different action type
}

const playerIndex = (f) => (f ? 0 : 1);
function reduceCooldownsForPlayer(pIdx) {
  swapCooldowns[pIdx].sphinx = Math.max(0, swapCooldowns[pIdx].sphinx - 1);
  swapCooldowns[pIdx].pharaoh = Math.max(0, swapCooldowns[pIdx].pharaoh - 1);
}
function applySwapSideEffects(move, sideIsFirstPlayer) {
  const pIdx = playerIndex(sideIsFirstPlayer);
  const tl = move.targetId % PIECES_PER_PLAYER;
  if (tl === 0) { swapCooldowns[pIdx].sphinx = COOLDOWN_TURNS; if (sideIsFirstPlayer === isFirstPlayerSelf) sphinxFiresThisTurn = false; }
  if (tl === 1) swapCooldowns[pIdx].pharaoh = COOLDOWN_TURNS;
}

export async function setup(initialPositions, isFirstPlayer) {
  isFirstPlayerSelf = !!isFirstPlayer;
  swapCooldowns = [{ sphinx: 0, pharaoh: 0 }, { sphinx: 0, pharaoh: 0 }];
  sphinxFiresThisTurn = true;

  const SELF_OFFSET = isFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  const OPP_OFFSET  = isFirstPlayer ? PLAYER_B_OFFSET : PLAYER_A_OFFSET;

  board.fill(BOARD_EMPTY);
  const sph = initialPositions.sphinx, ph = initialPositions.pharaoh;
  const sphMirror = 99 - sph, phMirror = 99 - ph;

  state[SELF_OFFSET + 0] = sph;       state[OPP_OFFSET + 0] = sphMirror;
  board[getPosition(sph)] = SELF_OFFSET + 0; board[getPosition(sphMirror)] = OPP_OFFSET + 0;
  state[SELF_OFFSET + 1] = ph;        state[OPP_OFFSET + 1] = phMirror;
  board[getPosition(ph)] = SELF_OFFSET + 1; board[getPosition(phMirror)] = OPP_OFFSET + 1;

  const phCol = getColumn(ph);
  state[SELF_OFFSET + 2] = computeCoordinates(computePosition(5, phCol), 2);
  state[OPP_OFFSET + 2]  = computeCoordinates(computePosition(6, 11 - phCol), 0);
  board[getPosition(state[SELF_OFFSET + 2])] = SELF_OFFSET + 2;
  board[getPosition(state[OPP_OFFSET + 2])]  = OPP_OFFSET + 2;

  state[SELF_OFFSET + 3] = computeCoordinates(computePosition(3, getColumn(sphMirror)), 2);
  state[OPP_OFFSET + 3]  = computeCoordinates(computePosition(8, 11 - getColumn(sph)), 0);
  board[getPosition(state[SELF_OFFSET + 3])] = SELF_OFFSET + 3;
  board[getPosition(state[OPP_OFFSET + 3])]  = OPP_OFFSET + 3;

  const sp = initialPositions.scarab.position, so = initialPositions.scarab.orientation;
  state[SELF_OFFSET + 4] = computeCoordinates(sp, shitDirection2Direction(so));
  state[OPP_OFFSET + 4]  = computeCoordinates(99 - sp, shitDirection2Direction(9 - so));
  board[getPosition(state[SELF_OFFSET + 4])] = SELF_OFFSET + 4;
  board[getPosition(state[OPP_OFFSET + 4])]  = OPP_OFFSET + 4;

  state.fill(PYRAMID_IN_RESERVE, SELF_OFFSET + 5, SELF_OFFSET + 12);
  state.fill(PYRAMID_IN_RESERVE, OPP_OFFSET + 5,  OPP_OFFSET + 12);

  repIdx = 0; repFilled = 0;
  recentHashIdx = 0; recentHashFilled = 0;
  recentBoardHashes.fill(0n);

  repPush(computeHash(state, isFirstPlayerSelf));
  return true;
}

export async function nextMove(opponentAction) {
  __resetStatePool();

  const opponentIsFirstPlayer = !isFirstPlayerSelf;
  reduceCooldownsForPlayer(playerIndex(opponentIsFirstPlayer));
  if (opponentAction) applyExternalAction(opponentAction, opponentIsFirstPlayer);
  rebuildBoardFromState(state);

  repPush(computeHash(state, isFirstPlayerSelf));

  reduceCooldownsForPlayer(playerIndex(isFirstPlayerSelf));
  sphinxFiresThisTurn = true;

  const selfOffset = isFirstPlayerSelf ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  const depth = chooseSearchDepth(state);
  const strat = new AlphaBetaStrategy(adapter, depth);
  setStateDepth(state, depth, depth);

  const deadlineMs = Date.now() + 190;
  strat.setDeadline(deadlineMs);

  // FIX v2: detect oscillation and pass banned piece set
  const bannedPieceIds = detectOscillatingPieces(state);

  const fallbackMove = { kind: 'move', pieceId: selfOffset + 1, to: -1 } ; // will be overridden
  const fallbackRotate = { kind: 'rotate', pieceId: selfOffset + 0, rotateInverse: false };
  const myMove = strat.findBestMove(state, isFirstPlayerSelf, bannedPieceIds) ?? fallbackRotate;

  pushRecentHash(computeHash(state, isFirstPlayerSelf));

  const externalAction = toExternalAction(myMove);

  state = applyMoveToState(state, myMove);
  if (myMove.kind === 'swap') applySwapSideEffects(myMove, isFirstPlayerSelf);
  rebuildBoardFromState(state);

  repPush(computeHash(state, !isFirstPlayerSelf));

  return externalAction;
}

/* Adapter */
const MAX_MOVES_TOTAL = 40;
const MAX_PLACE_MOVES = 10;

const adapter = {
  getPossibleMoves(currentState) {
    const savedState = state; __boardPush();
    try {
      state = currentState; rebuildBoardFromState(state);
      const side = this.getCurrentPlayer(currentState);
      const root = this.__rootIsFirstPlayer === undefined ? searchRootIsFirstPlayer : !!this.__rootIsFirstPlayer;
      const wantMax = side === root;
      const moves = Array.from(generateMoveActions(side));
      const scored = [];
      for (const m of moves) {
        const ns = applyMoveToState(state, m);
        const cd = getStateDepth(currentState), cm = getStateMaxDepth(currentState);
        if (cd > 0) setStateDepth(ns, cd - 1, cm);
        scored.push({ m, s: evaluate(ns, root) });
      }
      scored.sort((a, b) => wantMax ? b.s - a.s : a.s - b.s);
      const result = []; let pc = 0;
      for (const { m } of scored) {
        if (result.length >= MAX_MOVES_TOTAL) break;
        if (m.kind === 'place') { if (pc >= MAX_PLACE_MOVES) continue; pc++; }
        result.push(m);
      }
      return result;
    } finally { state = savedState; __boardPop(); }
  },

  applyMove(currentState, move) {
    const savedState = state; __boardPush();
    try {
      state = currentState; rebuildBoardFromState(state);
      const next = applyMoveToState(state, move);
      const cd = getStateDepth(currentState), cm = getStateMaxDepth(currentState);
      if (cd > 0) setStateDepth(next, cd - 1, cm);
      return next;
    } finally { state = savedState; __boardPop(); }
  },

  isTerminal(s) { return isTerminalState(s); },

  evaluate(s) {
    const root = this.__rootIsFirstPlayer === undefined ? searchRootIsFirstPlayer : !!this.__rootIsFirstPlayer;
    return evaluate(s, root);
  },

  getCurrentPlayer(s) {
    const d = getStateDepth(s), maxD = getStateMaxDepth(s);
    const root = this.__rootIsFirstPlayer === undefined ? searchRootIsFirstPlayer : !!this.__rootIsFirstPlayer;
    return ((maxD - d) % 2 === 0) ? root : !root;
  },
};

/* Move application */
function applyMoveToState(fromState, move) {
  const ns = __allocStateFrom(fromState);
  switch (move.kind) {
    case 'rotate': ns[move.pieceId] = rotate(fromState[move.pieceId], !!move.rotateInverse); break;
    case 'move':   ns[move.pieceId] = computeCoordinates(move.to, getDirection(fromState[move.pieceId])); break;
    case 'place':  ns[move.pieceId] = computeCoordinates(move.to, move.placeDir ?? 0); break;
    case 'swap': {
      const a = fromState[move.pieceId], b = fromState[move.targetId];
      ns[move.pieceId] = computeCoordinates(getPosition(b), getDirection(a));
      ns[move.targetId] = computeCoordinates(getPosition(a), getDirection(b));
      break;
    }
  }
  applyLaserAfterMove(ns, pieceOwnerOffset(move.pieceId) === PLAYER_A_OFFSET);
  return ns;
}

function rebuildBoardFromState(s) {
  board.fill(BOARD_EMPTY);
  for (let id = 0; id < s.length; id++) {
    const c = s[id];
    if (c === PYRAMID_IN_RESERVE) continue;
    const pos = getPosition(c);
    if (isInBoard(pos)) board[pos] = id;
  }
}

function mirrorCell(c) { return 99 - c; }
function mirrorRotationResult(r) { return r === 'CLOCKWISE' ? 'ANTICLOCKWISE' : r === 'ANTICLOCKWISE' ? 'CLOCKWISE' : r; }
function mirrorOrientation(o) { if (o === 0) return 99; if (o === 99) return 0; if (o === 9) return 90; if (o === 90) return 9; return o; }
function direction2ShitDirection(d) { return [0, 9, 90, 99][d] ?? (() => { throw new Error(`bad dir ${d}`); })(); }
function shitDirection2Direction(o) { const m = {0:0,9:1,90:2,99:3}; if (o in m) return m[o]; throw new Error(`bad orientation ${o}`); }

function toExternalAction(move) {
  const currentCell = getPosition(state[move.pieceId]);
  const base = (() => {
    switch (move.kind) {
      case 'rotate': return { action: 'ROTATE', cell: currentCell, result: move.rotateInverse ? 'ANTICLOCKWISE' : 'CLOCKWISE' };
      case 'move':   return { action: 'MOVE', cell: currentCell, result: move.to };
      case 'place':  return { action: 'PLACE', cell: getPosition(state[(isFirstPlayerSelf ? PLAYER_A_OFFSET : PLAYER_B_OFFSET) + 1]), result: { destination: move.to, orientation: direction2ShitDirection(move.placeDir ?? 0) } };
      case 'swap':   return { action: 'EXCHANGE', cell: currentCell, result: getPosition(state[move.targetId]) };
      default: throw new Error(`bad kind ${move.kind}`);
    }
  })();
  if (!isFirstPlayerSelf) {
    return {
      action: base.action,
      cell: mirrorCell(base.cell),
      result: base.action === 'ROTATE' ? mirrorRotationResult(base.result)
        : base.action === 'MOVE' || base.action === 'EXCHANGE' ? mirrorCell(base.result)
          : base.action === 'PLACE' ? { destination: mirrorCell(base.result.destination), orientation: mirrorOrientation(base.result.orientation) }
            : base.result,
    };
  }
  return base;
}

function fromExternalAction(action) {
  if (!action) return null;
  switch (action.action) {
    case 'ROTATE': { const pid = board[action.cell]; return pid === BOARD_EMPTY ? null : { kind: 'rotate', pieceId: pid, rotateInverse: action.result === 'ANTICLOCKWISE' }; }
    case 'MOVE':   { const pid = board[action.cell]; return pid === BOARD_EMPTY ? null : { kind: 'move', pieceId: pid, to: action.result }; }
    case 'PLACE':  { const d = action.result?.destination, o = action.result?.orientation; return (d == null || o == null) ? null : { kind: 'place', pieceId: -1, to: d, placeDir: shitDirection2Direction(o) }; }
    case 'EXCHANGE': { const s = board[action.cell], t = board[action.result]; return (s === BOARD_EMPTY || t === BOARD_EMPTY) ? null : { kind: 'swap', pieceId: s, targetId: t }; }
    default: return null;
  }
}

function applyExternalAction(action, sideIsFirstPlayer) {
  if (!action) return;
  const norm = sideIsFirstPlayer ? action : {
    action: action.action, cell: mirrorCell(action.cell),
    result: action.action === 'ROTATE' ? mirrorRotationResult(action.result)
      : action.action === 'MOVE' || action.action === 'EXCHANGE' ? mirrorCell(action.result)
        : action.action === 'PLACE' ? { destination: mirrorCell(action.result.destination), orientation: mirrorOrientation(action.result.orientation) }
          : action.result,
  };
  rebuildBoardFromState(state);
  const move = fromExternalAction(norm);
  if (!move) return;
  if (move.kind === 'place' && move.pieceId === -1) {
    const off = sideIsFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
    let chosen = -1;
    for (let l = 5; l < PIECES_PER_PLAYER; l++) { if (state[off + l] === PYRAMID_IN_RESERVE) { chosen = off + l; break; } }
    if (chosen === -1) return;
    move.pieceId = chosen;
  }
  state = applyMoveToState(state, move);
  if (move.kind === 'swap') applySwapSideEffects(move, sideIsFirstPlayer);
  rebuildBoardFromState(state);
}

/* Geometry */
const isInBoardPos = p => p >= 0 && p < BOARD_SIZE;
const isEmptyOn = (p, b) => isInBoardPos(p) && b[p] === BOARD_EMPTY;
const rotate = (piece, inv = false) => computeCoordinates(getPosition(piece), (getDirection(piece) + (inv ? 3 : 1)) % 4);
const isInBoard = p => p >= 0 && p < BOARD_SIZE;
const isEmpty = p => isInBoard(p) && board[p] === BOARD_EMPTY;
const isLegalMove = to => isInBoard(to) && isEmpty(to);
const isOrthogonalNeighbor = (f, t) => {
  if (!isInBoard(f) || !isInBoard(t)) return false;
  const fr = (f/10)|0, fc = f%10, tr = (t/10)|0, tc = t%10;
  return (fr === tr && Math.abs(fc-tc) === 1) || (fc === tc && Math.abs(fr-tr) === 1);
};
const countEmptyOrthogonalMoves = (pos, b) => {
  let n = 0;
  for (const np of [pos+1, pos-1, pos+10, pos-10])
    if (isOrthogonalNeighbor(pos, np) && isInBoard(np) && b[np] === BOARD_EMPTY) n++;
  return n;
};
function getLine(c) { return ((getPosition(c)/10)|0)+1; }
function getColumn(c) { return (getPosition(c)%10)+1; }
function computePosition(l, col) { return (l-1)*10+(col-1); }
function computeCoordinates(pos, dir) { return pos|(dir<<COORD_DIRECTION_SHIFT); }
function getDirection(c) { return c>>COORD_DIRECTION_SHIFT; }
function getPosition(c) { return c&COORD_POSITION_MASK; }

/* Terminal / move gen */
function isTerminalState(s) {
  const ap = s[PLAYER_A_OFFSET+1], bp = s[PLAYER_B_OFFSET+1];
  return !(ap !== PYRAMID_IN_RESERVE && isInBoard(getPosition(ap)) && bp !== PYRAMID_IN_RESERVE && isInBoard(getPosition(bp)));
}

function* generateMoveActions(isFirstPlayer) {
  rebuildBoardFromState(state);
  const O = isFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  yield { kind: 'rotate', pieceId: O, rotateInverse: false };
  yield { kind: 'rotate', pieceId: O, rotateInverse: true };
  for (const local of [1,2,3,4]) yield* generateRotateAndStepActions(O+local);
  const cds = swapCooldowns[playerIndex(isFirstPlayer)];
  if (cds.sphinx === 0) yield { kind: 'swap', pieceId: O+4, targetId: O };
  if (cds.pharaoh === 0) yield { kind: 'swap', pieceId: O+4, targetId: O+1 };
  for (let l = 5; l < PIECES_PER_PLAYER; l++) {
    const id = O+l, p = state[id];
    if (p === PYRAMID_IN_RESERVE) {
      for (let pos = 0; pos < BOARD_SIZE; pos++) {
        if (!isLegalPyramidSpawnCell(pos, isFirstPlayer, board)) continue;
        for (let dir = 0; dir < 4; dir++) yield { kind: 'place', pieceId: id, to: pos, placeDir: dir };
      }
    } else yield* generateRotateAndStepActions(id);
  }
}

function* generateRotateAndStepActions(pieceId) {
  const piece = state[pieceId], pos = getPosition(piece);
  yield { kind: 'rotate', pieceId, rotateInverse: false };
  yield { kind: 'rotate', pieceId, rotateInverse: true };
  for (const np of [pos+1, pos-1, computePosition(getLine(piece)+1,getColumn(piece)), computePosition(getLine(piece)-1,getColumn(piece))]) {
    if (isOrthogonalNeighbor(pos, np) && isLegalMove(np)) yield { kind: 'move', pieceId, to: np };
  }
}

function isLegalPyramidSpawnCell(position, isFirstPlayer, bcache = board) {
  if (!isInBoardPos(position) || !isEmptyOn(position, bcache)) return false;
  const selfOffset = isFirstPlayer ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  for (const n of [position+1, position-1, position+10, position-10]) {
    if (!isOrthogonalNeighbor(position, n) || !isInBoardPos(n)) continue;
    const pid = bcache[n]; if (pid === BOARD_EMPTY) continue;
    const li = pid % PIECES_PER_PLAYER;
    if (li === 0) return false;
    if (li === 1 && pid >= selfOffset && pid < selfOffset + PIECES_PER_PLAYER) return false;
  }
  return true;
}

function countReservePyramids(forFirst, s) {
  const off = forFirst ? PLAYER_A_OFFSET : PLAYER_B_OFFSET;
  let n = 0;
  for (let l = 5; l < PIECES_PER_PLAYER; l++) if (s[off+l] === PYRAMID_IN_RESERVE) n++;
  return n;
}

function chooseSearchDepth(s) {
  const t = countReservePyramids(isFirstPlayerSelf, s) + countReservePyramids(!isFirstPlayerSelf, s);
  if (t >= 10) return 3;
  if (t >= 6)  return 4;
  if (t >= 2)  return 5;
  return 6;
}

/* Laser */
const LOCAL_SPHINX = 0, LOCAL_PHARAOH = 1;
const DIR_DELTAS = [{dc:1,dr:0},{dc:0,dr:1},{dc:-1,dr:0},{dc:0,dr:-1}];
function cellToRC(cell) { return { r:(cell/10)|0, c:cell%10 }; }
function rcToCell(r,c) { return r*10+c; }
function inBoardRC(r,c) { return r>=0&&r<10&&c>=0&&c<10; }
function pieceLocalIndex(id) { return id%PIECES_PER_PLAYER; }
function pieceOwnerOffset(id) { return id<PLAYER_B_OFFSET?PLAYER_A_OFFSET:PLAYER_B_OFFSET; }
function capturePiece(s, id) { s[id] = PYRAMID_IN_RESERVE; }
const __laserBoardTmp = new Uint8Array(BOARD_SIZE);

function reflectLaser(local, inc, pdir) {
  const bs = pdir===0||pdir===2;
  switch (local) {
    case 4:
      return bs ? (inc===0?1:inc===1?0:inc===2?3:2) : (inc===0?3:inc===3?0:inc===2?1:2);
    case 5:case 6:case 7:case 8:case 9:case 10:case 11:
      return bs ? (inc===0?1:inc===1?0:-1) : (inc===0?3:inc===3?0:-1);
    case 2:case 3: return pdir===((inc+2)&3)?-2:-1;
    case 0: return -2;
    case 1: return -1;
    default: return -1;
  }
}

function applyLaserAfterMove(stateArr, sideIsFirstPlayer) {
  if (sideIsFirstPlayer === isFirstPlayerSelf && !sphinxFiresThisTurn) return;
  const btmp = __laserBoardTmp; btmp.fill(BOARD_EMPTY);
  for (let id = 0; id < stateArr.length; id++) {
    const c = stateArr[id]; if (c === PYRAMID_IN_RESERVE) continue;
    const pos = getPosition(c); if (isInBoard(pos)) btmp[pos] = id;
  }
  const off = sideIsFirstPlayer?PLAYER_A_OFFSET:PLAYER_B_OFFSET;
  const sc = stateArr[off+LOCAL_SPHINX]; if (sc===PYRAMID_IN_RESERVE) return;
  let {r,c} = cellToRC(getPosition(sc)), dir = getDirection(sc)&3;
  for (let step=0;step<100;step++) {
    const d=DIR_DELTAS[dir]; r+=d.dr; c+=d.dc;
    if (!inBoardRC(r,c)) break;
    const cell=rcToCell(r,c), pid=btmp[cell]; if (pid===BOARD_EMPTY) continue;
    const refl=reflectLaser(pieceLocalIndex(pid),dir,getDirection(stateArr[pid])&3);
    if (refl===-2) break;
    if (refl===-1) { capturePiece(stateArr,pid); break; }
    dir=refl;
  }
}

/* Eval */
const __evalBoard=new Uint8Array(BOARD_SIZE);
const __evalHitListA=new Int16Array(24),__evalHitListB=new Int16Array(24);
const __laserMark=new Int8Array(24);
const __traceOutA=new Int16Array(2),__traceOutB=new Int16Array(2);

function buildBoardNoAlloc(s,out) {
  out.fill(BOARD_EMPTY);
  for (let id=0;id<s.length;id++) { const c=s[id]; if(c===PYRAMID_IN_RESERVE)continue; const p=getPosition(c); if(isInBoard(p))out[p]=id; }
}

function traceLaserToOut2(s,bcache,sideIsFirst,outHits,mark,out2) {
  mark.fill(0); let refl=0,hc=0;
  const off=sideIsFirst?PLAYER_A_OFFSET:PLAYER_B_OFFSET;
  const sc=s[off+LOCAL_SPHINX];
  if (sc===PYRAMID_IN_RESERVE){out2[0]=-1;out2[1]=0;return;}
  let {r,c}=cellToRC(getPosition(sc)),dir=getDirection(sc)&3;
  for (let step=0;step<100;step++) {
    const d=DIR_DELTAS[dir]; r+=d.dr; c+=d.dc;
    if (!inBoardRC(r,c)){out2[0]=-1;out2[1]=refl;return;}
    const cell=rcToCell(r,c),pid=bcache[cell]; if(pid===BOARD_EMPTY)continue;
    if(mark[pid]===0){mark[pid]=1;outHits[hc++]=pid;}
    const rf=reflectLaser(pieceLocalIndex(pid),dir,getDirection(s[pid])&3);
    if(rf===-2){out2[0]=-1;out2[1]=refl;return;}
    if(rf===-1){out2[0]=pid;out2[1]=refl;return;}
    refl++; dir=rf;
  }
  out2[0]=-1;out2[1]=refl;
}

function countLegalMovesFast(s,bcache,sideIsFirst) {
  const O=sideIsFirst?PLAYER_A_OFFSET:PLAYER_B_OFFSET; let n=2;
  for (let l=1;l<=4;l++){const coord=s[O+l];if(coord===PYRAMID_IN_RESERVE)continue;const pos=getPosition(coord);if(!isInBoardPos(pos))continue;n+=2+countEmptyOrthogonalMoves(pos,bcache);}
  let ps=0;
  for (let l=5;l<PIECES_PER_PLAYER;l++){const coord=s[O+l];if(coord===PYRAMID_IN_RESERVE){if(ps>=12)continue;for(let cell=0;cell<BOARD_SIZE&&ps<12;cell++){if(bcache[cell]!==BOARD_EMPTY||!isLegalPyramidSpawnCell(cell,sideIsFirst,bcache))continue;n+=4;ps++;}continue;}const pos=getPosition(coord);if(!isInBoardPos(pos))continue;n+=2+countEmptyOrthogonalMoves(pos,bcache);}
  return n;
}

export function evaluate(s, me) {
  const myOff=me?PLAYER_A_OFFSET:PLAYER_B_OFFSET, oppOff=me?PLAYER_B_OFFSET:PLAYER_A_OFFSET;
  const myPh=s[myOff+LOCAL_PHARAOH], oppPh=s[oppOff+LOCAL_PHARAOH];
  const myAlive=myPh!==PYRAMID_IN_RESERVE&&isInBoard(getPosition(myPh));
  const oppAlive=oppPh!==PYRAMID_IN_RESERVE&&isInBoard(getPosition(oppPh));
  if(myAlive&&!oppAlive)return 100000;
  if(!myAlive&&oppAlive)return -100000;
  if(!myAlive&&!oppAlive)return 0;

  buildBoardNoAlloc(s,__evalBoard);
  traceLaserToOut2(s,__evalBoard,!!me,__evalHitListA,__laserMark,__traceOutA);
  traceLaserToOut2(s,__evalBoard,!me,__evalHitListB,__laserMark,__traceOutB);

  const mfh=__traceOutA[0],mr=__traceOutA[1],ofh=__traceOutB[0],or_=__traceOutB[1];
  let pt=0;
  if(mfh!==-1&&mfh===(oppOff+LOCAL_PHARAOH))pt+=1;
  if(ofh!==-1&&ofh===(myOff+LOCAL_PHARAOH))pt-=1;

  const myPhPos=getPosition(myPh),oppPhPos=getPosition(oppPh);
  const prot=(phPos,ownerOff)=>{let b=0;for(const n of[phPos+1,phPos-1,phPos+10,phPos-10]){if(!isOrthogonalNeighbor(phPos,n))continue;const pid=__evalBoard[n];if(pid!==BOARD_EMPTY&&pid>=ownerOff&&pid<ownerOff+PIECES_PER_PLAYER)b++;}return b;};
  const pharaohProtectionTerm=(prot(myPhPos,myOff)-prot(oppPhPos,oppOff))*0.05;

  let lp=0;
  if(mfh!==-1&&pieceOwnerOffset(mfh)===oppOff)lp+=1;
  if(ofh!==-1&&pieceOwnerOffset(ofh)===myOff)lp-=1;
  if(mr>=2)lp+=0.25; if(or_>=2)lp-=0.25;

  const mobility=countLegalMovesFast(s,__evalBoard,!!me)-countLegalMovesFast(s,__evalBoard,!me);
  let cc=0;
  for(let id=0;id<s.length;id++){const c=s[id];if(c===PYRAMID_IN_RESERVE)continue;const pos=getPosition(c);if(!isInBoard(pos))continue;const r=(pos/10)|0,col=pos%10;if(r<3||r>6||col<3||col>6)continue;cc+=(id>=myOff&&id<myOff+PIECES_PER_PLAYER)?1:-1;}

  const sideToPlay=adapter.getCurrentPlayer(s);
  const rep=repCount(computeHash(s,sideToPlay));

  return 9000*(pt+pharaohProtectionTerm)+40*lp+3*mobility+5*cc+(-20000*rep);
}

/**
 * @typedef {Object} Move
 * @property {'rotate'|'move'|'place'|'swap'} kind
 * @property {number} pieceId
 * @property {boolean} [rotateInverse]
 * @property {number} [to]
 * @property {number} [placeDir]
 * @property {number} [targetId]
 */