import {PIECE_TYPE} from "./model.js";

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
    }

    async init(gameEngine) {
        this.gameState = gameEngine;
        this.gameState.onPieceDeathEffect = (x, y, owner) => {
            this.triggerAshEffect(x, y, owner);
        };
        await new Promise(r => setTimeout(r, 100));
        this.contexts = this.gameBoard.getContexts();
        if (!this.contexts) {
            console.error("Impossible de récupérer les contextes du canvas");
            return;
        }
        await this.loadAsset('map', '/assets/map.jpg');
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
        this.drawBoard();
        this.drawPieces();
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

    drawPieces() {
        const ctx = this.contexts.pieces;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        const grid = this.gameState.getBoard();
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
        // --- MODIFICATION TAILLE ---
        const maxCellDimension = Math.min(this.cellWidth, this.cellHeight);

        // On passe à 1.25 (125%) pour que la figurine déborde un peu des lignes
        // Ça donne un effet "3D" bien plus lisible
        const destinationSize = maxCellDimension * 1.25;

        // Calcul du recadrage (Crop) pour garder le carré central
        const sourceSize = Math.min(img.width, img.height);
        const sx = (img.width - sourceSize) / 2;
        const sy = (img.height - sourceSize) / 2;

        // On renforce un peu l'ombre pour accompagner la taille
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        ctx.drawImage(
            img,
            sx, sy, sourceSize, sourceSize,
            -destinationSize / 2, -destinationSize / 2,
            destinationSize, destinationSize
        );

        ctx.restore();
    }

    drawHighlights() {
        const ctx = this.contexts.vfx;
        const player = this.gameState.turn;
        if (!ctx) return;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
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
                ctx.globalAlpha = 0.6; // Transparence
                ctx.translate(cx, cy);
                const rotationRad = (pending.rotation + 180) * Math.PI / 180;
                ctx.rotate(rotationRad);
                const maxCellDimension = Math.min(this.cellWidth, this.cellHeight);
                const destinationSize = maxCellDimension * 1.25;
                const sourceSize = Math.min(img.width, img.height);
                const sx = (img.width - sourceSize) / 2;
                const sy = (img.height - sourceSize) / 2;
                ctx.drawImage(
                    img,
                    sx, sy, sourceSize, sourceSize,
                    -destinationSize/2, -destinationSize/2,
                    destinationSize, destinationSize
                );
                ctx.rotate(-rotationRad);
                ctx.translate(-cx, -cy);
            }
            ctx.fillStyle = "white";
            ctx.font = `${this.cellWidth / 2.5}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "black";
            ctx.shadowBlur = 4;
            ctx.fillText("↻", cx, cy);
            const btnSize = this.cellWidth * 0.25;
            const btnX = x + this.cellWidth - btnSize/1.2;
            const btnY = y + this.cellHeight - btnSize/1.2;
            ctx.beginPath();
            ctx.fillStyle = "#00FF00";
            ctx.arc(btnX, btnY, btnSize/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.font = "bold 16px Arial";
            ctx.fillText("✓", btnX, btnY + 1);

            ctx.restore();
            return;
        }
        const selected = this.gameState.selectedPiece;
        if (!selected) return;
        const piece = this.gameState.board[selected.x][selected.y];
        if (!piece) return;
        if (piece.type === 'scarab') {
            const cooldowns = this.gameState.swapCooldowns[piece.owner];
            for(let cx=0; cx<10; cx++){
                for(let cy=0; cy<10; cy++){
                    const target = this.gameState.board[cx][cy];
                    if(target && target.owner === piece.owner) {
                        let canSwap = false;
                        if (target.type === 'sphinx' && cooldowns.sphinx === 0) canSwap = true;
                        if (target.type === 'pharaon' && cooldowns.pharaon === 0) canSwap = true;
                        if (canSwap) {
                            const tx = cx * this.cellWidth + this.cellWidth/2;
                            const ty = cy * this.cellHeight + this.cellHeight/2;
                            ctx.save();
                            ctx.beginPath();
                            ctx.strokeStyle = "#DDA0DD";
                            ctx.lineWidth = 3;
                            ctx.setLineDash([2, 2]);
                            ctx.arc(tx, ty, this.cellWidth/2.5, 0, Math.PI*2);
                            ctx.stroke();
                            ctx.fillStyle = "#DDA0DD";
                            ctx.font = "14px Arial";
                            ctx.fillText("⇄", tx, ty);
                            ctx.restore();
                        }
                    }
                }
            }
        }
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
        const validMoves = this.gameState.getPossibleMoves(selected.x, selected.y);
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

    // Positionner le debut du laser en fonction de la position de la wand
    getWandTip(x, y, rotation) {
        const cx = x * this.cellWidth + this.cellWidth / 2;
        const cy = y * this.cellHeight + this.cellHeight / 2;
        const forward = this.cellWidth * 0.30;
        const side = this.cellWidth * 0.1;
        let tipX = cx;
        let tipY = cy;
        if (rotation === 0) {
            tipY -= forward;
            tipX += side;
        }
        else if (rotation === 90) {
            tipX += forward;
            tipY += side;
        }
        else if (rotation === 180) {
            tipY += forward;
            tipX -= side;
        }
        else if (rotation === 270) {
            tipX -= forward;
            tipY -= side;
        }
        return { x: tipX, y: tipY };
    }

    startAnimationLoop() {
        const loop = () => {
            this.time += 0.1;
            this.drawVFX();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    drawVFX() {
        const ctx = this.contexts.vfx;
        if (!ctx) return;
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.drawHighlights(ctx);
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


    // Les lasers du début de tours
    drawMagicLaser(ctx) {
        if (!this.gameState.isProcessingTurn) return;
        const player = this.gameState.turn;
        const path = this.gameState.getLaserPath(player);
        if (!path || path.length < 2) return;
        let colorCore = "#FFFFFF";
        let colorGlow = "#FF0000";
        if (player === 2) colorGlow = "#00FF00";
        const startPiece = this.gameState.findSphinx(player);
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
        ctx.save();
        ctx.fillStyle = colorGlow;
        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i+1];
            const x1 = p1.x * this.cellWidth + this.cellWidth / 2;
            const y1 = p1.y * this.cellHeight + this.cellHeight / 2;
            const x2 = p2.x * this.cellWidth + this.cellWidth / 2;
            const y2 = p2.y * this.cellHeight + this.cellHeight / 2;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const segmentLength = Math.sqrt(dx*dx + dy*dy);
            const angle = Math.atan2(dy, dx);
            const particlesPerSegment = Math.max(3, Math.floor(segmentLength / 15));
            for (let k = 0; k < particlesPerSegment; k++) {
                const distance = Math.random() * segmentLength;
                const basePathX = x1 + Math.cos(angle) * distance;
                const basePathY = y1 + Math.sin(angle) * distance;
                const offsetBase = (Math.random() - 0.5) * (this.cellWidth * 0.6);
                const movement = Math.sin(this.time * 3 + distance * 0.1) * 4;
                const offsetAmount = offsetBase + movement;
                const particleX = basePathX + Math.cos(angle + Math.PI/2) * offsetAmount;
                const particleY = basePathY + Math.sin(angle + Math.PI/2) * offsetAmount;
                const size = Math.random() * 3 + 1;
                const opacity = Math.random() * 0.6 + 0.2;
                ctx.beginPath();
                ctx.globalAlpha = opacity;
                ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
        ctx.restore();
        const lastPoint = path[path.length - 1];
        const impactX = lastPoint.x * this.cellWidth + this.cellWidth / 2;
        const impactY = lastPoint.y * this.cellHeight + this.cellHeight / 2;

        for(let k=0; k<10; k++) {
            ctx.fillStyle = colorGlow;
            const px = impactX + (Math.random() - 0.5) * 50;
            const py = impactY + (Math.random() - 0.5) * 50;
            const size = Math.random() * 5 + 2;
            ctx.beginPath();
            ctx.globalAlpha = 0.5 + Math.sin(this.time * 20 + k) * 0.5;
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    }


    // Effet poussiere quand on detruit une piece
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