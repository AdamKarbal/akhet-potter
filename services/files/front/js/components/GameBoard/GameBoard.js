import {Renderer} from "../../game/Utils/Renderer.js";
import {InputHandler} from "../../game/Utils/InputManager.js";
import {HapticsService} from "../../services/HapticsService.js";

export class GameBoard extends HTMLElement {
    constructor(){
        super();
        this.attachShadow({mode: 'open'});
        this.socket = null;
        this.renderer = new Renderer(this);
        this.inputHandler = null;
        this.gameId = null;

        this.handleGameState = this.handleGameState.bind(this);
    }

    async connectedCallback(){

        //Mise en pace du composant
        const htmlUrl = new URL('./GameBoard.html', import.meta.url);
        const htmlResponse = await fetch(htmlUrl);
        const htmlContent = await htmlResponse.text();
        this.shadowRoot.innerHTML = htmlContent;
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', new URL('./GameBoard.css', import.meta.url));
        this.shadowRoot.appendChild(linkElem);

        console.log("Gameboard chargé (GameBoard.js)");

        //Informe le match-page qu'il est prêt et qu'il peut recevoir de lui les données de game
        requestAnimationFrame(async () => {
            await this.renderer.init();
            this.dispatchEvent(new CustomEvent('board-ready', {
                bubbles: true,
                composed: true
            }));
        });
    }

    handleGameState(data) {
        if (data.isProcessingTurn && data.laserPath && data.laserPath.length > 0) {
            HapticsService.vibrateDestroy();
        }
        else if (this.renderer.gameState && this.renderer.gameState.turn === data.turn) {
            HapticsService.vibrateMove();
        }
        this.renderer.gameState = data;
        this.renderer.renderAll();
    }

    setupSocketListeners(){
        this.socket.on("init-state", this.handleGameState);
        this.socket.on("game-update", this.handleGameState);
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

    disconnectedCallback() {
        this.stopSocketListeners();
    }

    stopSocketListeners() {
        if (this.socket) {
            this.socket.off("init-state", this.handleGameState);
            this.socket.off("game-update", this.handleGameState);
            console.log("Écoutes socket du GameBoard arrêtées proprement.");
        }
    }
}
customElements.define('game-board', GameBoard);