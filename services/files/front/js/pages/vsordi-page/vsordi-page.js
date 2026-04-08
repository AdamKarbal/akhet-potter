import '../../components/player-layout/player-layout.js'
import '../../components/moves-component/moves-component.js'
import '../../components/chat-component/chat-component.js'
import '../../components/navbar-component/navbar-component.js'
import '../../components/GameBoard/GameBoard.js'
import '../../components/AI-layout/ai-layout.js'
import '../../components/quit-component/quit-component.js'
import {API_URL} from "../../../config.js";
import {audioService} from "../../services/AudioService.js";
import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

export class JcOComponent extends HTMLElement{
    constructor() {
        super();
        this._gameEnded = false;
        this._gameId = null;
    }

    connectedCallback() {
        this.innerHTML = `
            <style>
                body{
                    background-image: url("/assets/background1v1.webp");
                    background-size: 100% 100%;
                    background-repeat: no-repeat;
                    min-height: 100vh;
                    margin: 0;
                }
                
                .container{
                    display: grid;
                    grid-template-columns: 10% 55% 35%;
                    grid-template-rows: 10% 80% 10%;
                }
                
                #nav {
                    grid-row: 1/4;
                    grid-column: 1;
                }

                #pl2{
                    grid-column: 2;
                    grid-row: 1;
                    margin-right: 5vw;
                    justify-items: center;
                    margin-left: 5vw;
                    align-self: center;
                }
                
                #pl1{ 
                    grid-column: 2;
                    grid-row: 3; 
                    margin-right: 5vw;
                    justify-items: center;
                    margin-left: 5vw;
                    margin-bottom: 3.5vh;
                }
                
                #right-aside{
                    grid-column: 3;
                    grid-row: 2;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    place-self: center;
                    align-items: center;
                    margin : 2vw;
                }
                
                .board{
                    border : 2px double #c5a059;
                    border-radius: 15px;
                    grid-column: 2;
                    grid-row: 2;
                    background-color: rgba(20, 15, 10, 0.55);
                    box-shadow: 0 0 15px #d4af37, inset 0 0 20px rgba(212, 175, 55, 0.3);
                    width: fit-content;
                    height: fit-content;
                    padding: 0;
                    place-self: center;
                }
            </style>
        <div class="container">
            <navbar-component id="nav"></navbar-component>
            <div class="board"><game-board></game-board></div>
            <div id="right-aside">
                <moves-component></moves-component>
                <quit-component></quit-component>
            </div>
            <ai-layout id="pl1"></ai-layout>
            <player-layout id="pl2"></player-layout>
        </div>
    `;

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
            this.querySelector("game-board").showWaitingScreen();
        });

        this.socket.on("match-found", (matchInfo) => {
            this._gameId = matchInfo.gameId;
            this.socket.off("waiting-for-opponent");
            const pl1 = this.querySelector("#pl1");
            const pl2 = this.querySelector("#pl2");
            if (pl2 && typeof pl2.setPlayerInfo === "function") {
                pl2.setPlayerInfo(matchInfo.player1);
            }
            if (pl1 && typeof pl1.setPlayerInfo === "function") {
                pl1.setPlayerInfo(matchInfo.player2);
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
                const toast = document.createElement('div');
                toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a0f05;border:3px double #c5a059;color:#fff8dc;padding:26px;border-radius:12px;z-index:10002;font-family:\'Agency FB\',sans-serif;text-align:center;min-width:280px;';
                toast.innerHTML = `<div style="font-size:1.7em;color:#d4af37;margin-bottom:8px;">${iWin ? 'VICTOIRE' : 'DEFAITE'}</div><div>${iWin ? 'Tu as battu l\'IA !' : 'L\'IA a gagné cette manche.'}</div>`;
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