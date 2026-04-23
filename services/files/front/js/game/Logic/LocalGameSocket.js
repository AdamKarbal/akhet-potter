import { GameEngine } from "./GameEngine.js";

const LOCAL_GAME_ID = "local_1v1";
const TURN_ANIMATION_DELAY_MS = 1200;
const TURN_DURATION_MS = 20000;

export class LocalGameSocket {
    constructor() {
        this.id = "local-screen";
        this.engine = new GameEngine();
        this.listeners = new Map();
        this.closed = false;
        this.turnTimer = null;
        this.turnTimerStartedAt = null;
    }

    on(event, handler) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(handler);
    }

    once(event, handler) {
        const wrapped = (...args) => {
            this.off(event, wrapped);
            handler(...args);
        };
        this.on(event, wrapped);
    }

    off(event, handler) {
        if (!this.listeners.has(event)) return;
        if (handler) this.listeners.get(event).delete(handler);
        else this.listeners.delete(event);
    }

    emit(event, payload, callback) {
        if (this.closed) return;

        if (event === "join-game") {
            this.startTurnTimer();
            this.emitLocal("init-state", this.engine.getState());
            return;
        }

        if (event === "fetch-state") {
            if (typeof callback === "function") callback(this.engine.getState());
            return;
        }

        if (event === "player-action") {
            this.handlePlayerAction(payload);
            return;
        }

        if (event === "leave-game") {
            this.closed = true;
            this.stopTurnTimer();
            this.emitLocal("back-to-homepage");
        }
    }

    handlePlayerAction(actionData) {
        if (!actionData || actionData.gameId !== LOCAL_GAME_ID) return;
        this.engine.handlePlayerInteraction(actionData.x, actionData.y, actionData.relX, actionData.relY);
        const state = this.engine.getState();
        this.emitLocal("game-update", state);

        if (!state.isProcessingTurn) return;
        this.stopTurnTimer();

        window.setTimeout(() => {
            if (this.closed) return;
            this.engine.isProcessingTurn = false;
            this.engine.lastLaserResult = null;
            const nextState = this.engine.getState();
            if (!nextState.winner) this.startTurnTimer();
            this.emitLocal("game-update", nextState);
            if (nextState.winner) this.emitLocal("game-over", nextState);
        }, TURN_ANIMATION_DELAY_MS);
    }

    startTurnTimer() {
        this.stopTurnTimer();
        if (this.closed || this.engine.winner) return;
        this.engine.remainingTurnMs = TURN_DURATION_MS;
        this.turnTimerStartedAt = Date.now();
        this.turnTimer = window.setTimeout(() => {
            if (this.closed || this.engine.winner) return;
            this.engine.winner = this.engine.turn === 1 ? 2 : 1;
            this.engine.remainingTurnMs = null;
            const state = this.engine.getState();
            this.emitLocal("game-update", state);
            this.emitLocal("game-over", state);
        }, TURN_DURATION_MS);
    }

    stopTurnTimer() {
        if (this.turnTimer) window.clearTimeout(this.turnTimer);
        if (this.turnTimerStartedAt) {
            const elapsed = Date.now() - this.turnTimerStartedAt;
            this.engine.remainingTurnMs = Math.max(0, TURN_DURATION_MS - elapsed);
        }
        this.turnTimer = null;
        this.turnTimerStartedAt = null;
    }

    emitLocal(event, payload) {
        const handlers = this.listeners.get(event);
        if (!handlers) return;
        [...handlers].forEach((handler) => handler(payload));
    }
}

export { LOCAL_GAME_ID };
