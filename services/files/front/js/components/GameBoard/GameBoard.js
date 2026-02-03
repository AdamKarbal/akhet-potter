import { GameEngine } from "../../game/Logic/GameEngine.js";
import { Renderer } from "../../game/Utils/Renderer.js";
import { InputHandler } from "../../game/Utils/InputManager.js"

export class GameBoard extends HTMLElement {
    constructor(){
        super();
        this.attachShadow({mode: 'open'});
        this.gameEngine = new GameEngine();
        this.renderer = new Renderer(this);
        this.inputHandler = null;
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
            await this.renderer.init(this.gameEngine);
            this.gameEngine.setHandlers({
                onRenderRequest: () => this.renderer.renderAll(),
                onPieceDeathEffect: (x, y, owner) => {
                    if (this.renderer.triggerAshEffect) {
                        this.renderer.triggerAshEffect(x, y, owner);
                    }
                },
                onGameEnd: (winner) => {
                    const name = winner === 1 ? "Joueur 1" : "Joueur 2";
                    setTimeout(() => {
                        alert(`VICTOIRE ! Bravo ${name} !`);
                        this.gameEngine.restart();
                    }, 500);
                },
                delay: (ms) => new Promise(r => setTimeout(r, ms))
            });
            this.inputHandler = new InputHandler(this, this.renderer, this.gameEngine);
            this.inputHandler.init();

            console.log("Inputs initialisés et Handlers connectés !");
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
}
customElements.define('game-board', GameBoard);