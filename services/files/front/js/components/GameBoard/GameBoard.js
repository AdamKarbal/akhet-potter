import { Renderer } from "../../game/Utils/Renderer.js";
import { InputHandler } from "../../game/Utils/InputManager.js"

export class GameBoard extends HTMLElement {
    constructor(){
        super();
        this.attachShadow({mode: 'open'});
        this.socket = null;
        this.renderer = new Renderer(this);
        this.inputHandler = null;
        this.gameId = null;
    }

    async connectedCallback(){
        const htmlUrl = new URL('./GameBoard.html', import.meta.url);
        const htmlResponse = await fetch(htmlUrl);
        const htmlContent = await htmlResponse.text();
        this.shadowRoot.innerHTML = htmlContent;
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', new URL('./GameBoard.css', import.meta.url));
        this.shadowRoot.appendChild(linkElem);
        console.log("Gameboard chargé (GameBoard.js)");

        requestAnimationFrame(async () => {
            await this.renderer.init();
            this.dispatchEvent(new CustomEvent('board-ready', {
                bubbles: true,
                composed: true
            }));
        });
    }

    setupSocketListeners(){
        this.socket.on("init-state", (state) => {
            console.log("Etat initial reçu du serveur.");
            this.renderer.gameState = state;
            this.renderer.renderAll();
        })

        this.socket.on("game-closed", (message) => {
            if (message) {
                console.error("Partie fermée:", message);
                alert(message);
            }
        });

        this.socket.on("game-update", (data) => {
            console.log("Mise à jour reçue :", data);
            this.renderer.gameState = data;
            this.renderer.renderAll();

            if (data.winner && !data.isProcessingTurn) {
                setTimeout(() => {
                    const veutRejouer = confirm(`Le Pharaon est tombé ! Victoire du Joueur ${data.winner}. Voulez-vous prendre votre revanche ?`);
                    if (veutRejouer) {
                        this.socket.emit("revenge", this.gameId);
                    } else {
                        console.log("Le joueur a quitté.");
                        this.socket.emit("leave-game", this.gameId);
                    }
                }, 200);
            }
        });
    }

    getContexts(){
        if (!this.shadowRoot.getElementById('layer-board')) return null;
        return {
            board: this.shadowRoot.getElementById('layer-board').getContext('2d'),
            pieces: this.shadowRoot.getElementById('layer-pieces').getContext('2d'),
            vfx: this.shadowRoot.getElementById('layer-vfx').getContext('2d'),
            vfxCanvas: this.shadowRoot.getElementById('layer-vfx')
        };
    }

    setSocketAndListen(socket, gameId) {
        this.socket = socket;
        this.gameId = gameId;
        this.setupSocketListeners();
        this.socket.emit("join-game", this.gameId);
        this.inputHandler = new InputHandler(this, this.renderer, this.socket);
        this.inputHandler.init();
    }

    showWaitingScreen() {
        this.renderer.drawWaitingScreen();
    }
}
customElements.define('game-board', GameBoard);