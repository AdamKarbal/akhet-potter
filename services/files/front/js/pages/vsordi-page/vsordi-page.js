import '../../components/player-layout/player-layout.js'
import '../../components/moves-component/moves-component.js'
import '../../components/chat-component/chat-component.js'
import '../../components/navbar-component/navbar-component.js'
import '../../components/GameBoard/GameBoard.js'
import '../../components/AI-layout/ai-layout.js'
import '../../components/quit-component/quit-component.js'
import {API_URL} from "../../../config.js";

const SOCKET_IO_ESM_URL = "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

export class JcOComponent extends HTMLElement{
    constructor() {
        super();
        this._gameEnded = false;
        this._gameId = null;
    }

    async connectedCallback() {
        const htmlUrl = new URL('./vsordi-page.html', import.meta.url);
        const cssUrl = new URL('./vsordi-page.css', import.meta.url);
        
        try {
            const [htmlResponse] = await Promise.all([
                fetch(htmlUrl)
            ]);

            const html = await htmlResponse.text();

            this.innerHTML = `
                <link rel="stylesheet" href="${cssUrl.href}">
                ${html}
            `;
            
            this.setupGame();

        } catch (error) {
            console.error("Failed to load vsordi page resources:", error);
        }
    }

    setupGame() {
        this.setupGameAsync();
    }

    async setupGameAsync() {
        const { io } = await import(SOCKET_IO_ESM_URL);
        const token = localStorage.getItem("token");
        this.socket = io(API_URL, {
            path: "/socket.io",
            transports: ["websocket"],
            auth: {token: token}
        });

        this.addEventListener("board-ready", () => {
            console.log(`le joueur ${this.socket.id} lance une recherche`);
            this.socket.emit("launch-game");
        })//On utilise cet événement pour éviter une RC sur le chargement du board et le dessin de l'attente

        const quitComp = this.querySelector('quit-component');
        if (quitComp) {
            quitComp.addEventListener('request-quit', () => {
                if (this._gameId) {
                    this.socket.emit("leave-game", this._gameId);
                } else {
                    window.location.hash = '';
                }
            });
        }

        this.socket.on("back-to-homepage", () => {
            window.location.hash = '';
        });

        this.socket.on("waiting-for-opponent", () => {
            console.log("En attente d'un adversaire...");
            const gameBoard = this.querySelector("game-board");
            if (gameBoard) gameBoard.showWaitingScreen();
        });

        this.socket.on("match-found", (matchInfo) => {
            this._gameId = matchInfo.gameId;
            this.socket.off("waiting-for-opponent");
            const humanInfo = matchInfo.player1;
            const aiInfo = {
                ...(matchInfo.player2 || {}),
                username: "Dumbledore"
            };
            const pl1 = this.querySelector("#pl1");
            const pl2 = this.querySelector("#pl2");
            if (pl2 && typeof pl2.setPlayerInfo === "function") {
                pl2.setPlayerInfo(humanInfo);
            }
            if (pl1 && typeof pl1.setPlayerInfo === "function") {
                pl1.setPlayerInfo(aiInfo);
            }

            const gameBoard = this.querySelector("game-board");
            if (gameBoard) {
                gameBoard.setSocketAndListen(this.socket, matchInfo.gameId);
            }
            const handleTimers = (state) => {
                const timerIA = this.querySelector('#pl1 player-timer');
                const timerHumain = this.querySelector('#pl2 player-timer');

                if (state.winner || state.isProcessingTurn) {
                    if (timerIA) timerIA.stopTimer();
                    if (timerHumain) timerHumain.stopTimer();
                    return;
                }

                // Use remainingTurnMs from server when available to align client timer with backend
                const remMs = (typeof state.remainingTurnMs === 'number' && state.remainingTurnMs > 0) ? state.remainingTurnMs : undefined;

                if (state.turn === 1) {
                    if (timerIA) timerIA.stopTimer();
                    if (timerHumain) timerHumain.startTimer(remMs);
                } else if (state.turn === 2) {
                    if (timerHumain) timerHumain.stopTimer();
                    if (timerIA) timerIA.startTimer(remMs);
                }
            };
            const handleReserves = (state) => {
                const invIA = this.querySelector('#pl1 player-inventory');
                const invHumain = this.querySelector('#pl2 player-inventory');
                if (state.players && state.players[1] && invHumain) {
                    invHumain.setReserves(state.players[1].reserves);
                }
                if (state.players && state.players[2] && invIA) {
                    invIA.setReserves(state.players[2].reserves);
                }
            };

            this.socket.on("init-state", (state) => {
                handleTimers(state);
                handleReserves(state);
            });
            this.socket.on("game-update", (state) => {
                handleTimers(state);
                handleReserves(state);
            });
            this.socket.on("game-over", (state) => {
                const timerIA = this.querySelector('#pl1 player-timer');
                const timerHumain = this.querySelector('#pl2 player-timer');
                if (timerIA) timerIA.stopTimer();
                if (timerHumain) timerHumain.stopTimer();
                if (this._gameEnded) return;
                this._gameEnded = true;
                const iWin = state && state.winner === 1;
                const resultText = state && state.reason === 'timeout'
                    ? (iWin ? 'Dumbledore a mis trop de temps.' : 'Tu as mis trop de temps.')
                    : (iWin ? 'Tu as battu Dumbledore !' : 'Dumbledore a gagné cette manche.');
                const toast = document.createElement('div');
                toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a0f05;border:3px double #c5a059;color:#fff8dc;padding:26px;border-radius:12px;z-index:10002;font-family:\'Agency FB\',sans-serif;text-align:center;min-width:280px;';
                toast.innerHTML = `<div style="font-size:1.7em;color:#d4af37;margin-bottom:8px;">${iWin ? 'VICTOIRE' : 'DEFAITE'}</div><div>${resultText}</div>`;
                document.body.appendChild(toast);
                setTimeout(() => {
                    if (document.body.contains(toast)) toast.remove();
                    window.location.hash = '';
                }, 2600);
            });
            this.socket.on("game-closed", () => {
                const timerIA = this.querySelector('#pl1 player-timer');
                const timerHumain = this.querySelector('#pl2 player-timer');
                if (timerIA) timerIA.stopTimer();
                if (timerHumain) timerHumain.stopTimer();
                if (!this._gameEnded) {
                    this._gameEnded = true;
                    window.location.hash = '';
                }
            });
        });
    }

    disconnectedCallback() {
        if(this.socket){
            this.socket.disconnect();
        }
    }
}

customElements.define('vsordi-page', JcOComponent);
