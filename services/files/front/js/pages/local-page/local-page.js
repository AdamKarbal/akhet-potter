import '../../components/player-layout/player-layout.js';
import '../../components/navbar-component/navbar-component.js';
import '../../components/GameBoard/GameBoard.js';
import '../../components/quit-component/quit-component.js';
import { LocalGameSocket, LOCAL_GAME_ID } from '../../game/Logic/LocalGameSocket.js';

export class LocalPage extends HTMLElement {
    constructor() {
        super();
        this.socket = null;
        this.activeTurn = null;
        this.handleInitState = this.handleInitState.bind(this);
        this.handleGameUpdate = this.handleGameUpdate.bind(this);
        this.handleGameOver = this.handleGameOver.bind(this);
        this.handleBackToHomepage = this.handleBackToHomepage.bind(this);
    }

    async connectedCallback() {
        const htmlUrl = new URL('./local-page.html', import.meta.url);
        const cssUrl = new URL('./local-page.css', import.meta.url);

        try {
            const htmlResponse = await fetch(htmlUrl);
            const html = await htmlResponse.text();
            this.innerHTML = `
                <link rel="stylesheet" href="${cssUrl.href}">
                ${html}
            `;

            this.setupGame();
        } catch (error) {
            console.error("Failed to load local page resources:", error);
        }
    }

    setupGame() {
        this.socket = new LocalGameSocket();
        this.socket.on("init-state", this.handleInitState);
        this.socket.on("game-update", this.handleGameUpdate);
        this.socket.on("game-over", this.handleGameOver);
        this.socket.on("back-to-homepage", this.handleBackToHomepage);

        this.setupPlayers();
        this.setupControls();

        const gameBoard = this.querySelector("game-board");
        if (gameBoard) {
            gameBoard.addEventListener('board-ready', () => {
                gameBoard.setSocketAndListen(this.socket, LOCAL_GAME_ID);
            }, { once: true });
        }
    }

    setupPlayers() {
        const player1 = { username: "Joueur 1" };
        const player2 = { username: "Joueur 2" };
        this.querySelector("#pl1")?.setPlayerInfo(player1);
        this.querySelector("#pl2")?.setPlayerInfo(player2);
    }

    setupControls() {
        this.querySelector("quit-component")?.addEventListener("request-quit", () => {
            window.location.hash = "";
        });
    }

    handleInitState(state) {
        this.handleTimers(state);
        this.handleReserves(state);
    }

    handleGameUpdate(state) {
        this.handleTimers(state);
        this.handleReserves(state);
    }

    handleGameOver(state) {
        const winnerName = state.winner === 1 ? "Joueur 1" : "Joueur 2";
        this.showResultToast(`${winnerName} gagne la partie`);
    }

    handleBackToHomepage() {
        window.location.hash = "";
    }

    handleTimers(state) {
        const timer1 = this.querySelector('#pl1 player-timer');
        const timer2 = this.querySelector('#pl2 player-timer');
        if (!timer1 || !timer2 || !state) return;

        if (state.winner || state.isProcessingTurn) {
            timer1.stopTimer();
            timer2.stopTimer();
            this.activeTurn = null;
            return;
        }

        const forceRestart = this.activeTurn !== state.turn;
        const duration = forceRestart ? 20000 : state.remainingTurnMs;

        if (state.turn === 1) {
            timer1.startTimer(duration, forceRestart);
            timer2.stopTimer();
        } else {
            timer1.stopTimer();
            timer2.startTimer(duration, forceRestart);
        }
        this.activeTurn = state.turn;
    }

    handleReserves(state) {
        const inv1 = this.querySelector('#pl1 player-inventory');
        const inv2 = this.querySelector('#pl2 player-inventory');

        if (state.players && state.players[1] && inv1) {
            inv1.setReserves(state.players[1].reserves);
        }
        if (state.players && state.players[2] && inv2) {
            inv2.setReserves(state.players[2].reserves);
        }
    }

    showResultToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a0f05;border:3px double #c5a059;color:#fff8dc;padding:26px;border-radius:12px;z-index:10002;font-family:'Agency FB',sans-serif;text-align:center;min-width:280px;box-shadow:0 0 40px rgba(0,0,0,0.85);";
        toast.innerHTML = `
            <div style="font-size:1.7em;color:#d4af37;margin-bottom:8px;">VICTOIRE</div>
            <div style="margin-bottom:18px;">${message}</div>
            <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
                <button id="local-replay" style="background:linear-gradient(135deg,#3d2a0e,#1f1406);border:1px solid #c5a059;color:#ffd700;cursor:pointer;font-family:'Agency FB',sans-serif;font-size:1rem;padding:8px 18px;">Rejouer</button>
                <button id="local-leave" style="background:linear-gradient(135deg,#4a1010,#250505);border:1px solid #8a1f1f;color:#ffcccc;cursor:pointer;font-family:'Agency FB',sans-serif;font-size:1rem;padding:8px 18px;">Quitter</button>
            </div>
        `;
        document.body.appendChild(toast);

        toast.querySelector("#local-replay").addEventListener("click", () => {
            toast.remove();
            this.restartLocalGame();
        });
        toast.querySelector("#local-leave").addEventListener("click", () => {
            toast.remove();
            window.location.hash = "";
        });
    }

    restartLocalGame() {
        this.querySelectorAll('player-timer').forEach((timer) => timer.stopTimer());
        this.activeTurn = null;
        this.socket.stopTurnTimer();
        this.socket.engine.restart();
        this.socket.startTurnTimer();
        this.socket.emitLocal("init-state", this.socket.engine.getState());
    }

    disconnectedCallback() {
        if (!this.socket) return;
        this.socket.off("init-state", this.handleInitState);
        this.socket.off("game-update", this.handleGameUpdate);
        this.socket.off("game-over", this.handleGameOver);
        this.socket.off("back-to-homepage", this.handleBackToHomepage);
    }
}

customElements.define('local-page', LocalPage);
