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
            this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        }

        handleMouseDown(e) {
            const coords = this.renderer.screenToGrid(e.clientX, e.clientY);
            if(!coords) return;
            if (coords) {
                console.log(`clic detecté à : ${coords.x}, ${coords.y}`);
                console.log(`Game id : ${this.component.gameId}`);
                this.socketService.emit('player-action', {
                    x: coords.x,
                    y: coords.y,
                    relX: coords.relX,
                    relY: coords.relY,
                    gameId: this.component.gameId,
                });
            }
        }
    }