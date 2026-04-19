import '../../components/player-layout/player-layout.js'
import '../../components/chat-component/chat-component.js'
import '../../components/navbar-component/navbar-component.js'
import '../../components/GameBoard/GameBoard.js'
import '../../components/quit-component/quit-component.js'
import '../../components/revenge-component/revenge-component.js'
import {socket} from '../../socket.js'

export class MatchComponent extends HTMLElement{
    constructor() {
        super();
        this.isGameActive = false;
        this.internalNav = false;
        this._forfeitEnded = false;
        this._eloToastOpen = false;
        this.socket = socket;
        this.hashHandler = (event) => {
            if (this.internalNav) {
                this.internalNav = false;
                return;
            }
            if (this.isGameActive) this.warningToastLeave(event.oldURL);
        };
    }

    async connectedCallback() {
        const htmlUrl = new URL('./match-page.html', import.meta.url);
        const cssUrl = new URL('./match-page.css', import.meta.url);
        
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
            console.error("Failed to load match page resources:", error);
        }
    }

    setupGame() {
        const matchInfo = JSON.parse(sessionStorage.getItem('matchInfo'));
        this._matchInfo = matchInfo;

        if (matchInfo) {
            const pl1 = this.querySelector("#pl1");
            const pl2 = this.querySelector("#pl2");
            if (pl1 && pl2) {
                pl1.setPlayerInfo(matchInfo.player1);
                pl2.setPlayerInfo(matchInfo.player2);
            }
            this.isGameActive = true;

            const gameBoard = this.querySelector("game-board");

            if (gameBoard) {
                gameBoard.addEventListener('board-ready', () => {
                    gameBoard.setSocketAndListen(this.socket, matchInfo.gameId);
                }, { once: true });

                this.socket.on('game-over', (data) => {
                    if (data && data.reason === 'forfeit') {
                        this.isGameActive = false;
                        this._forfeitEnded = true;
                        this.showForfeitWinToast(data.message || "Victoire par forfait");
                        setTimeout(() => {
                            if (this._forfeitEnded && !this._eloToastOpen) {
                                window.location.hash = '';
                            }
                        }, 4500);
                        return;
                    }
                    const revengePopup = document.createElement('revenge-component');
                    this.appendChild(revengePopup);
                    revengePopup.setResult(data);

                    const timeoutId = setTimeout(() => {
                            if (this.contains(revengePopup)) {
                                revengePopup.remove();
                                window.location.hash = '';
                                this.socket.emit('leave-game', matchInfo.gameId);
                            }
                        }, 10000);

                        revengePopup.addEventListener('revenge', () => {
                            clearTimeout(timeoutId);
                            this.socket.emit('revenge', matchInfo.gameId);
                        });

                        this.socket.once('back-to-homepage', () => {
                            clearTimeout(timeoutId);
                        });

                        revengePopup.addEventListener('leave', () => {
                            this.socket.emit('leave-game', matchInfo.gameId);
                            revengePopup.remove();
                            window.location.hash = '';
                        });
                });

                this.socket.on('revenge-granted', () => {
                    const revengePopup = document.querySelector('revenge-component');
                    if(document.contains(revengePopup)) {
                        revengePopup.remove();
                    }
                });
            }
        }

        this.socket.on("elo-updated", (eloResult) => {
            this.isGameActive = false;
            this.showEloEvolutionToast(eloResult);
        });

        this.socket.on("invitation-timeout", () => {
            window.location.hash = 'SOC';
        });

        window.addEventListener("hashchange", this.hashHandler);

        const quitComp = this.querySelector('quit-component');
        if (quitComp) {
            quitComp.addEventListener('request-quit', () => {
                this.warningToastLeave(window.location.href);
            });
        }

        const inGameChat = this.querySelector("chat-component");
        if (inGameChat && matchInfo && matchInfo.gameId) inGameChat.setGameId(matchInfo.gameId);

        const handleTimers = (state) => {
            const timer1 = this.querySelector('#pl1 player-timer');
            const timer2 = this.querySelector('#pl2 player-timer');
            if (state.winner || state.isProcessingTurn) {
                if (timer1) timer1.stopTimer();
                if (timer2) timer2.stopTimer();
                return;
            }
            if (state.winner) {
                if (timer1) timer1.stopTimer();
                if (timer2) timer2.stopTimer();
                return;
            }

            // Align client timers with server remaining time when provided
            const remMs = (typeof state.remainingTurnMs === 'number' && state.remainingTurnMs > 0) ? state.remainingTurnMs : undefined;

            if (state.turn === 1) {
                if (timer1) timer1.startTimer(remMs);
                if (timer2) timer2.stopTimer();
            } else if (state.turn === 2) {
                if (timer1) timer1.stopTimer();
                if (timer2) timer2.startTimer(remMs);
            }
        };

        const handleReserves = (state) => {
            const inv1 = this.querySelector('#pl1 player-inventory');
            const inv2 = this.querySelector('#pl2 player-inventory');

            if (state.players && state.players[1] && inv1) {
                inv1.setReserves(state.players[1].reserves);
            }
            if (state.players && state.players[2] && inv2) {
                inv2.setReserves(state.players[2].reserves);
            }
        };

        this.socket.on("init-state", (state) => {
            console.debug('[match-page] init-state remainingTurnMs=', state && state.remainingTurnMs);
            this._joining = false;
            handleTimers(state);
            handleReserves(state);
        });

        this.socket.on("game-update", (state) => {
            console.debug('[match-page] game-update remainingTurnMs=', state && state.remainingTurnMs);
            handleTimers(state);
            handleReserves(state);
        });

        // Demander explicitement l'état au serveur au chargement/reconnexion
        if (matchInfo && matchInfo.gameId) {
            console.debug('[match-page] requesting join-game for', matchInfo.gameId);
            // flag indiquant qu'on est en train d'essayer de rejoindre la partie
            this._joining = true;
            this.socket.emit('join-game', matchInfo.gameId);
            // Puis demander l'état de manière synchrone (callback) pour s'assurer
            // d'obtenir la valeur remainingTurnMs la plus à jour du backend.
            try {
                this.socket.emit('fetch-state', matchInfo.gameId, (state) => {
                    console.debug('[match-page] fetch-state callback remainingTurnMs=', state && state.remainingTurnMs);
                    if (state) {
                        handleTimers(state);
                        handleReserves(state);
                        // réussite : on a reçu l'état, on n'est plus en phase de join
                        this._joining = false;
                    }
                });
            } catch (e) {
                console.error('Erreur fetch-state emission:', e);
            }
        }

        this.socket.on("game-closed", (msg) => {
            // Si on recevait game-closed pendant la tentative de join, cela signifie
            // que la partie n'existe plus ou n'est pas à cet utilisateur : revenir à la page précédente
            try {
                if (this._joining) {
                    console.debug('[match-page] game-closed received during join, redirecting back', msg);
                    this._joining = false;
                    // retourner à la page précédente
                    if (window.history && window.history.length > 1) window.history.back();
                    else window.location.hash = '';
                    return;
                }
            } catch (e) {
                console.error('Erreur lors du handling de game-closed:', e);
            }

            const timer1 = this.querySelector('#pl1 player-timer');
            const timer2 = this.querySelector('#pl2 player-timer');
            if (timer1) timer1.stopTimer();
            if (timer2) timer2.stopTimer();
        });
    }

    showEloEvolutionToast(data) {
        this._eloToastOpen = true;
        const toast = document.createElement('div');
        const isWinner = localStorage.getItem('username') === data.winnerInfos.username;

        toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.5);
        background: linear-gradient(135deg, #1a0f05 0%, #2a1a0a 100%);
        border: 3px double ${isWinner ? '#01cc41' : '#ff0000'};
        color: #fff8dc;
        padding: 40px;
        border-radius: 15px;
        z-index: 10005;
        text-align: center;
        font-family: 'Agency FB', sans-serif;
        box-shadow: 0 0 50px rgba(0,0,0,0.9), 0 0 30px ${isWinner ? 'rgba(35,181,0,0.4)' : 'rgba(181,0,0,0.4)'};
        opacity: 0;
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

        const diffText = isWinner ? `+${data.winnerInfos.wGain}` : `-${data.looserInfos.lGain}`;
        const diffColor = '#d4af37';

        toast.innerHTML = `
        <div style="font-size: 1.5em; letter-spacing: 2px; margin-bottom: 10px; color: #d4af37;">
            ${isWinner ? 'VICTOIRE MAGIQUE' : 'DEFAITE HONORABLE'}
        </div>
        <div style="font-size: 4em; font-weight: bold; margin: 10px 0;">
            ${isWinner? data.winnerInfos.newWinnerElo : data.looserInfos.newLooserElo} <span style="font-size: 0.5em; color: ${diffColor};">${diffText}</span>
        </div>
        <div style="font-size: 1.2em; color: #d4af37; font-style: italic;">
            Rang : ${isWinner? data.winnerInfos.newRank : data.looserInfos.newRank}
        </div>
        <button id="close-elo" style="
            margin-top: 25px;
            background: none;
            border: 1px solid #c5a059;
            border-radius: 15px;
            color: #c5a059;
            padding: 8px 20px;
            cursor: pointer;
            font-family: 'Agency FB';
            transition: all 0.3s;
            font-size: 1em;
        ">CONTINUER</button>
    `;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        const closeToast = () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => {
                toast.remove();
                this._eloToastOpen = false;
                this.isGameActive = false;
            }, 500);
        };

        toast.querySelector('#close-elo').onclick = closeToast;

        if (this._forfeitEnded) {
            setTimeout(() => {
                if (document.body.contains(toast)) closeToast();
            }, 3500);
        }
    }

    showForfeitWinToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.7);
            background: #1a0f05;
            border: 3px double #c5a059;
            color: #fff8dc;
            padding: 30px;
            border-radius: 12px;
            z-index: 10002;
            font-family: 'Agency FB', sans-serif;
            text-align: center;
            min-width: 340px;
            opacity: 0;
            transition: all 0.3s;
        `;
        toast.innerHTML = `
            <div style="font-size:2em; color:#d4af37; margin-bottom:10px;">🏆</div>
            <div style="font-size:1.4em; margin-bottom:12px;">${message}</div>
            <div style="font-size:1.1em; color:#d4af37;">Victoire par forfait</div>
        `;
        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        setTimeout(() => {
            toast.remove();
        }, 3500);
    }

    warningToastLeave(oldUrl) {
        const toast = document.createElement('div');
        toast.className = 'toast-warning-centered';

        toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.7);
        background: #1a0f05;
        border: 3px double #c5a059;
        color: #fff8dc;
        padding: 30px;
        border-radius: 12px;
        z-index: 10002;
        font-family: 'Agency FB', sans-serif;
        box-shadow: 0 0 50px rgba(0,0,0,0.9), 0 0 20px rgba(197, 160, 89, 0.3);
        text-align: center;
        min-width: 300px;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

        toast.innerHTML = `
        <div style="font-size: 2em; color: #d4af37; margin-bottom: 10px;">⚡</div>
        <div style="font-size: 1.4em; margin-bottom: 20px; letter-spacing: 1px;">
            Si tu quittes la partie maintenant, cela sera comptabilisé comme déclaration de forfait. Es-tu sûr de vouloir quitter?
        </div>
        <button id="leave-btn" style="
            background: #fb0202;
            color: #ffffff;
            border: none;
            padding: 8px 25px;
            font-family: 'Agency FB', sans-serif;
            font-weight: bold;
            font-size: 1.1em;
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.2s;
        ">QUITTER</button>     
        
        <button id="stay-btn" style="
            background: #38fb02;
            color: #ffffff;
            border: none;
            padding: 8px 25px;
            font-family: 'Agency FB', sans-serif;
            font-weight: bold;
            font-size: 1.1em;
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.2s;
        ">Rester</button>
    `;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        const leaveBtn = toast.querySelector("#leave-btn");
        const stayBtn = toast.querySelector("#stay-btn");

        leaveBtn.onmouseover = () => leaveBtn.style.transform = 'scale(1.1)';
        leaveBtn.onmouseout = () => leaveBtn.style.transform = 'scale(1)';
        stayBtn.onmouseover = () => stayBtn.style.transform = 'scale(1.1)';
        stayBtn.onmouseout = () => stayBtn.style.transform = 'scale(1)';

        leaveBtn.onclick = () => {
            this.isGameActive = false;
            const gid = this._matchInfo ? this._matchInfo.gameId : null;
            if (gid) this.socket.emit("leave-game", gid);
            toast.remove();
            window.location.hash = '';
        };

        stayBtn.onclick = () => {
            const oldHash = oldUrl.split('#')[1] || 'JCJ';
            if (window.location.hash !== `#${oldHash}`) {
                this.internalNav = true;
                window.location.hash = oldHash;
            }
            toast.remove();
        };

        setTimeout(() => {
            if (toast.parentNode) stayBtn.onclick();
        }, 8000);
    }

    disconnectedCallback() {
        window.removeEventListener("hashchange", this.hashHandler);
        this._joining = false;
    }

}

customElements.define('match-page', MatchComponent);
