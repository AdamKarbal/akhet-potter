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
        if (!this.canvas) return;
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.gameEngine.setRenderer(this.renderer);
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const rawX = (e.clientX - rect.left) * scaleX;
        const rawY = (e.clientY - rect.top) * scaleY;
        const col = Math.floor(rawX / this.renderer.cellWidth);
        const row = Math.floor(rawY / this.renderer.cellHeight);
        const relX = (rawX % this.renderer.cellWidth) / this.renderer.cellWidth;
        const relY = (rawY % this.renderer.cellHeight) / this.renderer.cellHeight;
        if (col >= 0 && col < 10 && row >= 0 && row < 10) {
            this.gameEngine.handlePlayerInteraction(col, row, relX, relY);
        }
    }
}