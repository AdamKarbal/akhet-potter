import {PIECE_TYPE} from "../Model/model.js";

export class Renderer {
    constructor(gameBoardComponent) {
        this.gameBoard = gameBoardComponent;
        this.contexts = null;
        this.assets = {};
        this.canvasWidth = 0;
        this.canvasHeight = 0;
        this.cellWidth = 0;
        this.cellHeight = 0;
        this.gameState = null;
        this.animationFrameId = null;
        this.time = 0;
        this.particles = [];
        this.latestState = null;
        this.currentLaserPath = null;
    }

    async init() {
        await new Promise(r => setTimeout(r, 100));

        await this.loadAsset('map', '/assets/map.png');
        const pieces = Object.values(PIECE_TYPE);
        const players = [1, 2];
        const promises = [];
        pieces.forEach(p => {
            players.forEach(id => {
                const key = `${p}t${id}`;
                promises.push(this.loadAsset(key, `/assets/pieces/${key}.png`));
            });
        });
        await Promise.all(promises);
        this.setupResizeHandler();
        this.handleResize();
    }

    screenToGrid(clientX, clientY) {
        const contexts = this.gameBoard.getContexts();
        if (!contexts) return null;
        const canvas = contexts?.vfx?.canvas;
        const ctx = contexts.board;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const rawX = (clientX - rect.left) * scaleX;
        const rawY = (clientY - rect.top) * scaleY;
        const col = Math.floor(rawX / this.cellWidth);
        const row = Math.floor(rawY / this.cellHeight);
        const relX = (rawX % this.cellWidth) / this.cellWidth;
        const relY = (rawY % this.cellHeight) / this.cellHeight;
        if (col < 0 || col >= 10 || row < 0 || row >= 10) return null;
        return { x: col, y: row, relX, relY };
    }

    loadAsset(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets[name] = img;
                resolve(img);
            };
            img.onerror = (e) => {
                console.warn(`Image manquante : ${src}`);
                resolve(null);
            };
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
            if (canvas) {
                canvas.width = this.canvasWidth;
                canvas.height = this.canvasHeight;
            }
        });
        this.cellWidth = this.canvasWidth / 10;
        this.cellHeight = this.canvasHeight / 10;
        this.startAnimationLoop();
        this.renderAll();
    }

    renderAll() {
        if(!this.gameState || !this.gameState.grid) return;
        this.drawBoard();
        this.drawPieces();
        this.drawHighlights();
    }

    drawBoard() {
        const contexts = this.gameBoard.getContexts();
        if (!contexts) return null;
        const ctx = contexts.board;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        if (this.assets['map']) {
            ctx.drawImage(this.assets['map'], 0, 0, this.canvasWidth, this.canvasHeight);
        }
        ctx.strokeStyle = "rgba(139, 90, 43, 1)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.cellWidth, 0);
            ctx.lineTo(i * this.cellWidth, this.canvasHeight);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * this.cellHeight);
            ctx.lineTo(this.canvasWidth, i * this.cellHeight);
            ctx.stroke();
        }
    }

    drawPieces() {
        const contexts = this.gameBoard.getContexts();
        if (!contexts) return null;
        const ctx = contexts.pieces;
        if (!ctx || !this.gameState || !this.gameState.grid) return;

        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        const grid = this.gameState.grid;

        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                const piece = grid[x][y];
                if (piece) {
                    this.drawSinglePiece(ctx, piece, x, y);
                }
            }
        }
    }

    drawSinglePiece(ctx, piece, x, y) {
        const key = `${piece.type}t${piece.owner}`;
        const img = this.assets[key];
        if (!img) return;
        const centerX = x * this.cellWidth + this.cellWidth / 2;
        const centerY = y * this.cellHeight + this.cellHeight / 2;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((piece.rotation + 180) * Math.PI / 180);
        const maxCellDimension = Math.min(this.cellWidth, this.cellHeight);
        const destinationSize = maxCellDimension * 1.25;
        const sourceSize = Math.min(img.width, img.height);
        const sx = (img.width - sourceSize) / 2;
        const sy = (img.height - sourceSize) / 2;
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.drawImage(img, sx, sy, sourceSize, sourceSize, -destinationSize / 2, -destinationSize / 2, destinationSize, destinationSize);
        ctx.restore();
    }


    drawHighlights() {
        if(!this.gameState || !this.gameState.grid) return;
        const contexts = this.gameBoard.getContexts();
        if (!contexts) return null;
        const ctx = contexts.vfx;
        const player = this.gameState.turn;
        if (!ctx) return;

        const pending = this.gameState.pendingPlacement;
        if (pending) {
            const x = pending.x * this.cellWidth;
            const y = pending.y * this.cellHeight;
            const cx = x + this.cellWidth / 2;
            const cy = y + this.cellHeight / 2;
            ctx.save();
            ctx.strokeStyle = "#00FFFF";
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);
            ctx.setLineDash([]);
            const key = `pyramidt${player}`;
            const img = this.assets[key];
            if (img) {
                ctx.globalAlpha = 0.6;
                ctx.translate(cx, cy);
                const rotationRad = (pending.rotation + 180) * Math.PI / 180;
                ctx.rotate(rotationRad);
                const maxCellDimension = Math.min(this.cellWidth, this.cellHeight);
                const destinationSize = maxCellDimension * 1.25;
                const sourceSize = Math.min(img.width, img.height);
                const sx = (img.width - sourceSize) / 2;
                const sy = (img.height - sourceSize) / 2;
                ctx.drawImage(img, sx, sy, sourceSize, sourceSize, -destinationSize/2, -destinationSize/2, destinationSize, destinationSize);
                ctx.rotate(-rotationRad);
                ctx.translate(-cx, -cy);
            }
            this.drawLaserPrediction(ctx, pending);
            ctx.fillStyle = "white";
            ctx.font = `${this.cellWidth / 2.5}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "black";
            ctx.shadowBlur = 4;
            ctx.fillText("↻", cx, cy);
            this.drawCheckmarkButton(ctx, x, y);
            ctx.restore();
            return;
        }

        const rotating = this.gameState.pendingRotation;
        if (rotating) {
            const x = rotating.x * this.cellWidth;
            const y = rotating.y * this.cellHeight;
            ctx.save();
            ctx.strokeStyle = "#FFFF00";
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);
            ctx.fillStyle = "white";
            ctx.font = `${this.cellWidth / 2.5}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "black";
            ctx.shadowBlur = 4;
            ctx.fillText("↻", x + this.cellWidth / 2, y + this.cellHeight / 2);
            this.drawCheckmarkButton(ctx, x, y);
            ctx.restore();
            return;
        }
        const selected = this.gameState.selectedPiece;
        if (!selected) return;

        const boardGrid = this.gameState.grid;
        const piece = boardGrid[selected.x][selected.y];
        if (!piece) return;


        const x = selected.x * this.cellWidth;
        const y = selected.y * this.cellHeight;
        let color = piece.owner === 1 ? "#FF0000" : "#00FF00";
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);
        ctx.restore();

        const validMoves = this.gameState.possibleMoves || [];
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        validMoves.forEach(move => {
            const centerX = move.x * this.cellWidth + this.cellWidth / 2;
            const centerY = move.y * this.cellHeight + this.cellHeight / 2;
            const radius = this.cellWidth / 6;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        ctx.font = `${this.cellWidth / 2.5}px Arial`;
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText("↻", x + this.cellWidth / 2, y + this.cellWidth / 2);
        ctx.restore();
    }

    drawLaserPrediction(ctx, pending) {
        return;
    }

    predictReflection(pyramidRot, incomingDir) {
        if (pyramidRot === 0) {
            if (incomingDir === 270) return 180;
            if (incomingDir === 0) return 90;
        }
        if (pyramidRot === 90) {
            if (incomingDir === 90) return 180;
            if (incomingDir === 0) return 270;
        }
        if (pyramidRot === 180) {
            if (incomingDir === 90) return 0;
            if (incomingDir === 180) return 270;
        }
        if (pyramidRot === 270) {
            if (incomingDir === 270) return 0;
            if (incomingDir === 180) return 90;
        }
        return null;
    }

    drawPredictionArrow(ctx, gridX, gridY, direction) {
        const cx = gridX * this.cellWidth + this.cellWidth / 2;
        const cy = gridY * this.cellHeight + this.cellHeight / 2;
        const offset = this.cellWidth * 0.35;
        ctx.save();
        ctx.translate(cx, cy);
        let rotationRad = 0;
        if (direction === 90) rotationRad = Math.PI / 2;
        if (direction === 180) rotationRad = Math.PI;
        if (direction === 270) rotationRad = -Math.PI / 2;
        ctx.rotate(rotationRad);
        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 255, 0, 0.6)";
        ctx.moveTo(0, -offset - 10);
        ctx.lineTo(-8, -offset + 5);
        ctx.lineTo(8, -offset + 5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = "yellow";
        ctx.shadowBlur = 10;
        ctx.stroke();

        ctx.restore();
    }

    drawCheckmarkButton(ctx, x, y) {
        const btnSize = this.cellWidth * 0.25;
        const btnX = x + this.cellWidth - btnSize/1.2;
        const btnY = y + this.cellHeight - btnSize/1.2;
        ctx.beginPath();
        ctx.fillStyle = "#00FF00";
        ctx.arc(btnX, btnY, btnSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✓", btnX, btnY + 1);
    }

    getWandTip(x, y, rotation) {
        const cx = x * this.cellWidth + this.cellWidth / 2;
        const cy = y * this.cellHeight + this.cellHeight / 2;
        const forward = this.cellWidth * 0.30;
        const side = this.cellWidth * 0.1;
        let tipX = cx; let tipY = cy;
        if (rotation === 0) { tipY -= forward; tipX += side; }
        else if (rotation === 90) { tipX += forward; tipY += side; }
        else if (rotation === 180) { tipY += forward; tipX -= side; }
        else if (rotation === 270) { tipX -= forward; tipY -= side; }
        return { x: tipX, y: tipY };
    }

    startAnimationLoop() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        const loop = () => {
            this.time += 0.1;
            this.drawVFX();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    drawVFX() {
        if(!this.gameState) return;
        const contexts = this.gameBoard.getContexts();
        if (!contexts) return null;
        const ctx = contexts.vfx;
        if (!ctx) return;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.drawHighlights();
        this.drawMagicLaser(ctx);
        this.updateAndDrawParticles(ctx);
    }

    updateAndDrawParticles(ctx) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.015;
            p.rotation += p.rotSpeed;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
        }
    }

    drawMagicLaser(ctx) {
        if (!this.gameState || !this.gameState.isProcessingTurn) return;
        const player = this.gameState.laserFiredBy || this.gameState.turn;

        const path = this.gameState.laserPath;
        if (!path || path.length < 2) return;

        let colorCore = "#FFFFFF";
        let colorGlow = (player === 1) ? "#FF0000" : "#00FF00";

        let startPiece = null;
        const grid = this.gameState.grid;
        for(let x=0; x<10; x++) {
            for(let y=0; y<10; y++) {
                const p = grid[x][y];
                if(p && p.type === 'sphinx' && p.owner === player) {
                    startPiece = {x, y, piece: p};
                    break;
                }
            }
        }
        if(!startPiece) return;

        const startPoint = this.getWandTip(startPiece.x, startPiece.y, startPiece.piece.rotation);
        ctx.save();
        const startGrad = ctx.createRadialGradient(startPoint.x, startPoint.y, 0, startPoint.x, startPoint.y, this.cellWidth * 0.25);
        startGrad.addColorStop(0, "#FFFFFF");
        startGrad.addColorStop(0.3, colorGlow);
        startGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save();
        ctx.fillStyle = startGrad;
        const bulbSize = (this.cellWidth * 0.18) + Math.sin(this.time * 8) * (this.cellWidth * 0.04);
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, bulbSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = colorGlow;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        for (let i = 1; i < path.length; i++) {
            const px = path[i].x * this.cellWidth + this.cellWidth / 2;
            const py = path[i].y * this.cellHeight + this.cellHeight / 2;
            const jitterAmount = 3;
            const jitterX = (Math.random() - 0.5) * jitterAmount;
            const jitterY = (Math.random() - 0.5) * jitterAmount;
            ctx.lineTo(px + jitterX, py + jitterY);
        }
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.shadowBlur = 25 + Math.sin(this.time * 5) * 10;
        ctx.shadowColor = colorGlow;
        ctx.strokeStyle = colorGlow;
        ctx.lineWidth = 8 + Math.sin(this.time * 10) * 3;
        ctx.stroke();
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FFFFFF";
        ctx.strokeStyle = colorCore;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
    }

    triggerAshEffect(gridX, gridY, owner) {
        const centerX = gridX * this.cellWidth + this.cellWidth / 2;
        const centerY = gridY * this.cellHeight + this.cellHeight / 2;
        const baseGray = owner === 1 ? 100 : 60;
        const particleCount = 60;
        for (let i = 0; i < particleCount; i++) {
            const startX = centerX + (Math.random() - 0.5) * this.cellWidth * 0.8;
            const startY = centerY + (Math.random() - 0.5) * this.cellHeight * 0.8;
            const vx = (Math.random() - 0.5) * 2;
            const vy = -Math.random() * 3 - 1;
            const size = Math.random() * 5 + 2;
            const grayVar = Math.floor(Math.random() * 50);
            const finalGray = baseGray + grayVar;
            this.particles.push({
                x: startX,
                y: startY,
                vx: vx,
                vy: vy,
                size: size,
                color: `rgb(${finalGray},${finalGray},${finalGray})`,
                alpha: 1.0,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }
}