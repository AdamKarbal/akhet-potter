export class InputHandler {

    constructor(gameBoardComponent, renderer, gameEngine) {
        this.component = gameBoardComponent;
        this.renderer = renderer;
        this.gameEngine = gameEngine;
        this.canvas = null;
    }

    init() {
        const root = this.component.shadowRoot ? this.component.shadowRoot : this.component;
        this.canvas = root.querySelector('#layer-vfx');

        if (!this.canvas) {
            console.error("Canvas VFX introuvable pour les inputs");
            return;
        }
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    }

    handleMouseDown(e) {
        const coords = this.renderer.screenToGrid(e.clientX, e.clientY);
        if (coords) {
            this.gameEngine.handlePlayerInteraction(coords.x, coords.y, coords.relX, coords.relY);
        }
    }
}