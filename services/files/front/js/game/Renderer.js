export class Renderer {
    constructor(gameBoardComponent){
        this.gameBoard = gameBoardComponent;
        this.contexts = null;
        this.assets = {};
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.cellWidth = 0;
        this.cellHeight = 0;
    }

    async init(){
        await new Promise(r => setTimeout(r, 100));
        this.contexts=this.gameBoard.getContexts();
        if (!this.contexts) {
            console.error("Impossible de récupérer les contextes du canvas");
            return;
        }
        await this.loadAsset('map', '/assets/map.jpg');
        this.setupResizeHandler();
        this.handleResize();
    }

    loadAsset(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets[name] = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 200);
        });
    }

    handleResize() {
        const wrapper = this.gameBoard.shadowRoot.querySelector('.board-wrapper');
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        this.canvasWidth = Math.floor(rect.width);
        this.canvasHeight = Math.floor(rect.height);
        ['layer-board', 'layer-pieces', 'layer-vfx'].forEach(id => {
            const canvas = this.gameBoard.shadowRoot.getElementById(id);
            if(canvas) {
                canvas.width = this.canvasWidth;
                canvas.height = this.canvasHeight;
            }
        });
        this.cellWidth = this.canvasWidth / 10;
        this.cellHeight = this.canvasHeight / 10;
        this.drawBoard()
    }

    drawBoard() {
        const ctx = this.contexts.board;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        if (this.assets['map']) {
            ctx.drawImage(this.assets['map'], 0, 0, this.canvasWidth, this.canvasHeight);
        }

        // Dessin de la grille sur la map
        ctx.strokeStyle = "rgba(139, 90, 43, 1)";
        ctx.lineWidth = 1;

        // Boucle de 0 à 10 pour tracer les lignes.
        for (let i = 0; i <= 10; i++) {
            // Verticale
            ctx.beginPath();
            ctx.moveTo(i * this.cellWidth, 0);
            ctx.lineTo(i * this.cellWidth, this.canvasHeight);
            ctx.stroke();

            // Horizontale
            ctx.beginPath();
            ctx.moveTo(0, i * this.cellHeight);
            ctx.lineTo(this.canvasWidth, i * this.cellHeight);
            ctx.stroke();
        }
    }
}