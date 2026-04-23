export class InputHandler {

    constructor(gameBoardComponent, renderer, socketService) {
        this.component = gameBoardComponent;
        this.renderer = renderer;
        this.socketService = socketService;
        this.canvas = null;
    }

    init() {
        const root = this.component.shadowRoot ? this.component.shadowRoot : this.component;
        this.canvas = root.querySelector('#layer-vfx');

        if (!this.canvas) {
            console.error("Canvas VFX introuvable pour les inputs");
            return;
        }
        this.canvas.addEventListener('mousedown', (e) => this.handleInput(e.clientX, e.clientY));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleInput(touch.clientX, touch.clientY);
        }, { passive: false });
    }

    handleInput(clientX, clientY) {
        const coords = this.renderer.screenToGrid(clientX, clientY);
        if(!coords) return;

        let finalRelX = coords.relX;
        let finalRelY = coords.relY;

        if (document.body.classList.contains('is-android')) {
            if (finalRelX > 0.5 && finalRelY > 0.5) {
                finalRelX = 0.5;
                finalRelY = 0.5;
            }
        }

        console.log(`Clic detecté à : ${coords.x}, ${coords.y} | relX: ${finalRelX.toFixed(2)}, relY: ${finalRelY.toFixed(2)}`);

        this.socketService.emit('player-action', {
            x: coords.x,
            y: coords.y,
            relX: finalRelX,
            relY: finalRelY,
            gameId: this.component.gameId,
        });
    }
}