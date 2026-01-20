import {PLAYER, PIECE_TYPE, DIRECTION} from "./model.js";

export class GameEngine {
    constructor() {
        this.board = [];
        this.turn = PLAYER.P1; // 1
        this.selectedPiece = null;
        this.renderer = null;
        this.reserves = {
            1: 7,
            2: 7
        }; // Nombre pyramide en reserve
        this.pendingPlacement = null;
        this.isProcessingTurn = false;
        this.swapCooldowns = {
            1: { sphinx: 0, pharaon: 0 },
            2: { sphinx: 0, pharaon: 0 }
        };
        this.sphinxFiresThisTurn = true;
        this.onPieceDeathEffect = null;
        this.turnCount=0;
        this.initBoard();
    }

    setRenderer(renderer) {
        this.renderer = renderer;
    }

    createEmptyGrid(){
        return Array(10).fill(null).map(()=>Array(10).fill(null));
    }

    // fait spawn les pièces selon les règles
    initBoard() {
        this.board = this.createEmptyGrid();
        const sphinxCol = Math.floor(Math.random() * 10);
        const sphinxRot = (sphinxCol < 5) ? DIRECTION.RIGHT : DIRECTION.LEFT;
        this.addPiece(sphinxCol, 0, PIECE_TYPE.SPHINX, PLAYER.P1, sphinxRot);
        const forbiddenCols = [0, 9, sphinxCol, 9 - sphinxCol];
        let pharaonCol;
        do {
            pharaonCol = Math.floor(Math.random() * 10);
        } while (forbiddenCols.includes(pharaonCol));
        this.addPiece(pharaonCol, 2, PIECE_TYPE.PHARAON, PLAYER.P1, DIRECTION.DOWN);
        this.addPiece(pharaonCol, 4, PIECE_TYPE.ANUBIS, PLAYER.P1, DIRECTION.DOWN);
        this.addPiece(9 - sphinxCol, 2, PIECE_TYPE.ANUBIS, PLAYER.P1, DIRECTION.DOWN);
        let scarabCol;
        do {
            scarabCol = Math.floor(Math.random() * 10);
        } while (this.board[scarabCol][3] !== null);
        const randomRot = [0, 90][Math.floor(Math.random() * 2)];
        this.addPiece(scarabCol, 3, PIECE_TYPE.SCARAB, PLAYER.P1, randomRot);
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 5; y++) {
                const p1Piece = this.board[x][y];
                if (p1Piece && p1Piece.owner === PLAYER.P1) {
                    const p2X = 9 - x;
                    const p2Y = 9 - y;
                    const p2Rot = (p1Piece.rotation + 180) % 360;

                    this.addPiece(p2X, p2Y, p1Piece.type, PLAYER.P2, p2Rot);
                }
            }
        }
    }

    addPiece(x, y, type, owner, rotation){
        this.board[x][y] = {
            type: type,
            owner: owner,
            rotation: rotation
        };
    }

    getBoard(){
        return this.board;
    }

    selectPiece(x, y) {
        const piece = this.board[x][y];
        if (this.selectedPiece && this.selectedPiece.x === x && this.selectedPiece.y === y) {
            this.selectedPiece = null;
            return;
        }
        if (piece) {
            this.selectedPiece = { x, y };
            console.log("Sélection :", piece.type);
        } else {
            this.selectedPiece = null;
        }
    }


    tryMovePiece(fromX, fromY, toX, toY) {
        const piece = this.board[fromX][fromY];
        if (!piece) return false;
        if (piece.type === 'sphinx' || piece.type === 'pharaon') {
            console.log("Cette pièce ne peut pas bouger !");
            return false;
        }
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);
        if (dx + dy !== 1) {
            console.log("Déplacement invalide (doit être orthogonal et d'1 case)");
            return false;
        }
        if (this.board[toX][toY] !== null) {
            console.log("Case occupée !");
            return false;
        }
        this.board[toX][toY] = piece;
        this.board[fromX][fromY] = null;
        console.log("Déplacement fait");
        return true;
    }

    rotatePiece(x, y) {
        const piece = this.board[x][y];
        if (piece) {
            piece.rotation = (piece.rotation + 90) % 360;
            console.log(`Rotation : ${piece.rotation}°`);
            return true;
        }
        return false;
    }

    // Pour afficher quand on clique sur une pièce
    getPossibleMoves(x, y) {
        const piece = this.board[x][y];
        if (!piece || piece.type === 'sphinx' || piece.type === 'pharaon') return [];
        const moves = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                if (Math.abs(dx) + Math.abs(dy) !== 1) continue;
                const targetX = x + dx;
                const targetY = y + dy;
                if (targetX >= 0 && targetX < 10 && targetY >= 0 && targetY < 10) {
                    if (this.board[targetX][targetY] === null) {
                        moves.push({ x: targetX, y: targetY });
                    }
                }
            }
        }
        return moves;
    }


    handlePlayerInteraction(x, y, relX = 0.5, relY = 0.5) {
        if (this.isProcessingTurn) return;
        const clickedPiece = this.board[x][y];
        if (this.pendingPlacement) {
            if (this.pendingPlacement.x === x && this.pendingPlacement.y === y) {
                if (relX > 0.6 && relY > 0.6) {
                    const dropped = this.tryDropPyramid(x, y, this.pendingPlacement.rotation);
                    if (dropped) {
                        this.pendingPlacement = null;
                        this.finishAction();
                    }
                } else {
                    this.pendingPlacement.rotation = (this.pendingPlacement.rotation + 90) % 360;
                    console.log(`Rotation fantôme : ${this.pendingPlacement.rotation}°`);
                    this.updateView();
                }
                return;
            }
            this.pendingPlacement = null;
            this.updateView();
        }
        const selected = this.selectedPiece; // On récupère la sélection ici
        if (!clickedPiece && !selected) {
            if (this.reserves[this.turn] > 0 && !this.isCellForbiddenForSpawn(x, y)) {
                const defaultRot = (this.turn === 1) ? 180 : 0;
                this.pendingPlacement = {
                    x,
                    y,
                    rotation: defaultRot
                };
                this.selectedPiece = null;
                this.updateView();
                console.log("Mode Placement : Cliquez au centre pour tourner, dans le coin vert pour valider.");
                return;
            }
        }
        if (clickedPiece && clickedPiece.owner !== this.turn && !selected) {
            console.log("Ce n'est pas votre pièce !");
            return;
        }

        if (selected) {
            const selectedPieceObj = this.board[selected.x][selected.y];
            if (selectedPieceObj && selectedPieceObj.type === 'scarab') {
                if (clickedPiece && clickedPiece.owner === this.turn) {
                    if (clickedPiece.type === 'sphinx' || clickedPiece.type === 'pharaon') {
                        const swapped = this.trySwapScarab(selected.x, selected.y, x, y);
                        if (swapped) {
                            this.finishAction();
                            return;
                        }
                    }
                }
            }
            if (selected.x === x && selected.y === y) {
                this.rotatePiece(x, y);
                this.finishAction();
                return;
            }
            const validMoves = this.getPossibleMoves(selected.x, selected.y);
            const isMoveValid = validMoves.some(m => m.x === x && m.y === y);
            if (isMoveValid) {
                const moved = this.tryMovePiece(selected.x, selected.y, x, y);
                if (moved) {
                    this.finishAction();
                }
                return;
            }
            if (clickedPiece && clickedPiece.owner === this.turn) {
                this.selectPiece(x, y);
                this.updateView();
                return;
            }
            this.selectedPiece = null;
            this.updateView();
        }
        else if (clickedPiece && clickedPiece.owner === this.turn) {
            this.selectPiece(x, y);
            this.updateView();
        }
    }
    finishAction() {
        this.selectedPiece = null;
        this.updateView();
        this.executeTurnSequence();
    }

    updateView() {
        if (this.renderer) this.renderer.renderAll();
    }

    switchTurn(){
        this.turnCount++;
        if (this.turnCount >= 100) {
            console.log(" LIMITE DE TOURS ATTEINTE : MATCH NUL !");
            alert("MATCH NUL (100 tours atteints)");
            return;
        }
        const nextPlayer = (this.turn === 1) ? 2 : 1;
        if (this.swapCooldowns[nextPlayer].sphinx > 0) this.swapCooldowns[nextPlayer].sphinx--;
        if (this.swapCooldowns[nextPlayer].pharaon > 0) this.swapCooldowns[nextPlayer].pharaon--;
        this.turn = nextPlayer;
        this.sphinxFiresThisTurn = true;
        console.log(` Tour ${this.turnCount}/100 - Joueur ${this.turn}`);
    }

    findSphinx(player) {
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                const piece = this.board[x][y];
                if (piece && piece.type === 'sphinx' && piece.owner === player) {
                    return { x, y, piece };
                }
            }
        }
        return null;
    }

    // Calcul le chemin du laser et regarde les pieces touchés
    getLaserPath(player) {
        const sphinxData = this.findSphinx(player);
        if (!sphinxData) return [];
        const path = [];
        path.hits = [];
        let currentX = sphinxData.x;
        let currentY = sphinxData.y;
        let direction = sphinxData.piece.rotation;
        let steps = 0;
        while (steps < 100) {
            steps++;
            path.push({ x: currentX, y: currentY });
            let dx = 0, dy = 0;
            if (direction === 0) dy = -1;
            else if (direction === 90) dx = 1;
            else if (direction === 180) dy = 1;
            else if (direction === 270) dx = -1;
            currentX += dx;
            currentY += dy;
            if (currentX < 0 || currentX >= 10 || currentY < 0 || currentY >= 10) {
                path.push({ x: currentX, y: currentY });
                break;
            }
            const piece = this.board[currentX][currentY];
            if (piece) {
                path.push({ x: currentX, y: currentY });
                const reflection = this.calculateReflection(piece, direction);
                if (reflection === 'BLOCK') {
                    break;
                }
                else if (reflection === 'HIT') {
                    path.hits.push({ x: currentX, y: currentY, piece: piece });
                }
                else {
                    direction = reflection;
                }
            }
        }
        return path;
    }

    // si une pyramid/scarab/anubis... touché on regarde si le laser change de direction ou si il detruit la piece
    calculateReflection(piece, incomingDir) {
        if (piece.type === 'scarab') {
            const isSlash = (piece.rotation === 0 || piece.rotation === 180);
            if (isSlash) {
                if (incomingDir === 180) return 270;
                if (incomingDir === 0) return 90;
                if (incomingDir === 90) return 0;
                if (incomingDir === 270) return 180;
            } else {
                if (incomingDir === 180) return 90;
                if (incomingDir === 0) return 270;
                if (incomingDir === 90) return 180;
                if (incomingDir === 270) return 0;
            }
        }

        if (piece.type === 'pyramid') {
            if (piece.rotation === 0) {
                if (incomingDir === 180) return 90;
                if (incomingDir === 270) return 180;
                return 'HIT';
            }
            if (piece.rotation === 90) {
                if (incomingDir === 180) return 270;
                if (incomingDir === 90) return 180;
                return 'HIT';
            }
            if (piece.rotation === 180) {
                if (incomingDir === 0) return 270;
                if (incomingDir === 90) return 0;
                return 'HIT';
            }
            if (piece.rotation === 270) {
                if (incomingDir === 0) return 90;
                if (incomingDir === 270) return 0;
                return 'HIT';
            }
        }
        if (piece.type === 'anubis') {
            const laserOpposite = (incomingDir + 180) % 360;
            if (piece.rotation === laserOpposite) {
                console.log("🛡Anubis bloque le tir !");
                return 'BLOCK';
            } else {
                return 'HIT';
            }
        }
        if (piece.type === 'pharaon') {
            return 'HIT';
        }
        if (piece.type === 'sphinx') {
            return 'BLOCK';
        }
        return 'HIT';
    }

    fireLaser(player) {
        const path = this.getLaserPath(player);
        if (path.length === 0) return false;
        if (!path.hits || path.hits.length === 0) return false;
        let deadPharaonOwner = null;
        path.hits.forEach(hit => {
            const target = hit.piece;
            console.log(`Pièce détruite : ${target.type} (Team ${target.owner})`);
            if (this.onPieceDeathEffect) {
                this.onPieceDeathEffect(hit.x, hit.y, target.owner);
            }
            this.board[hit.x][hit.y] = null;
            if (target.type === 'pyramid') {
                const opponent = (target.owner === 1) ? 2 : 1;
                this.reserves[opponent]++;
                console.log(`Pyramide redonnée au joueur ${opponent}.`);
            }
            if (target.type === 'pharaon') {
                deadPharaonOwner = target.owner;
            }
        });
        if (deadPharaonOwner !== null) {
            const winner = (deadPharaonOwner === 1) ? 2 : 1;
            setTimeout(() => {
                alert(`VICTOIRE DU JOUEUR ${winner} !`);
            }, 100);

            return true;
        }
        return true;
    }

    // Pour le spawn des pyramid voir si on peut spawn sur cette case
    isCellForbiddenForSpawn(x, y) {
        const neighbors = [
            {x: x+1, y: y}, {x: x-1, y: y},
            {x: x, y: y+1}, {x: x, y: y-1}
        ];

        for (const n of neighbors) {
            if (n.x < 0 || n.x >= 10 || n.y < 0 || n.y >= 10) continue;
            const piece = this.board[n.x][n.y];
            if (piece) {
                if (piece.type === 'sphinx') return true;
                if (piece.type === 'pharaon' && piece.owner === this.turn) return true;
            }
        }
        return false;
    }

    tryDropPyramid(x, y, rotation) {
        if (this.reserves[this.turn] <= 0) {
            console.log("Plus de pyramides !");
            return false;
        }
        this.addPiece(x, y, 'pyramid', this.turn, rotation);
        this.reserves[this.turn]--;
        console.log(`Pyramide posée (Rot: ${rotation}°) !`);
        return true;
    }

    // echanger le scarabe avec l'anubis ou le pharaon
    trySwapScarab(scarabX, scarabY, targetX, targetY) {
        const scarab = this.board[scarabX][scarabY];
        const target = this.board[targetX][targetY];
        if (!scarab || !target || scarab.type !== 'scarab') return false;
        let type = null;
        if (target.type === 'sphinx') type = 'sphinx';
        else if (target.type === 'pharaon') type = 'pharaon';
        else return false;
        if (this.swapCooldowns[this.turn][type] > 0) {
            console.log(`Action en recharge ! Attendez ${this.swapCooldowns[this.turn][type]} tours.`);
            return false;
        }
        this.board[scarabX][scarabY] = target;
        this.board[targetX][targetY] = scarab;
        this.swapCooldowns[this.turn][type] = 5;
        if (type === 'sphinx') {
            this.sphinxFiresThisTurn = false;
            console.log("Swap Scarabée <-> Sphinx ! Le laser ne tirera pas.");
        } else {
            console.log("Swap Scarabée <-> Pharaon !");
        }

        return true;
    }

    async executeTurnSequence() {
        this.isProcessingTurn = true;
        console.log("Séquence de fin de tour...");
        await new Promise(r => setTimeout(r, 300));
        if (this.sphinxFiresThisTurn) {
            this.fireLaser(this.turn);
            this.updateView();
            await new Promise(r => setTimeout(r, 1500));
        } else {
            console.log("Le Sphinx se repose");
            await new Promise(r => setTimeout(r, 800));
        }
        this.switchTurn();
        this.isProcessingTurn = false;
        this.updateView();
    }
}