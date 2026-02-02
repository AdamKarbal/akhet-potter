import { Piece, PLAYER, PIECE_TYPE } from "../Model/model.js";
import {Board} from "../Model/Board.js";
import {Player} from "../Player/Player.js";
import {HumanPlayer} from "../Player/HumanPlayer.js"
import { Referee } from "./Referee.js";
import { LaserPhysics } from "./LaserPhysics.js";

export class GameEngine {
    constructor() {
        this.board = new Board();
        this.players = {
            1: new HumanPlayer(PLAYER.P1),
            2: new HumanPlayer(PLAYER.P2)
        };
        this.turn = PLAYER.P1;
        this.turnCount = 0;
        this.referee = new Referee();
        this.selectedPiece = null;
        this.pendingPlacement = null;
        this.pendingRotation = null;
        this.isProcessingTurn = false;
        this.sphinxFiresThisTurn = true;
        this.renderer = null;
        this.handlers = {
            onRenderRequest: () => {},
            onPieceDeathEffect: () => {},
            onGameEnd: (winner) => {
                alert(`FIN DE PARTIE : ${winner}`);
                this.restart();
            },
            delay: (ms) => new Promise(r => setTimeout(r, ms))
        };
        this.board.setupStandardGame();
    }

    setRenderer(renderer) { this.renderer = renderer; }
    setHandlers(handlers) { this.handlers = handlers || {}; }

    handlePlayerInteraction(x, y, relX = 0.5, relY = 0.5) {
        if (this.isProcessingTurn) return;
        if (this.pendingPlacement) {
            this.handlePendingPlacement(x, y, relX, relY);
            return;
        }
        if (this.pendingRotation) {
            this.handlePendingRotation(x, y, relX, relY);
            return;
        }
        const clickedPiece = this.board.getPiece(x, y);
        if (!this.selectedPiece) {
            if (!clickedPiece) {
                this.tryStartPlacementMode(x, y);
                return;
            }
            if (clickedPiece.owner === this.turn) {
                this.selectPiece(x, y);
                return;
            }
            return;
        }
        this.handleSelectionLogic(x, y, clickedPiece);
    }


    handleSelectionLogic(x, y, clickedPiece) {
        const selX = this.selectedPiece.x;
        const selY = this.selectedPiece.y;
        const selectedPieceObj = this.board.getPiece(selX, selY);
        const currentPlayer = this.players[this.turn];
        if (selX === x && selY === y) {
            this.startRotationMode(selX, selY, selectedPieceObj);
            return;
        }
        if (selectedPieceObj.type === PIECE_TYPE.SCARAB && clickedPiece && clickedPiece.owner === this.turn) {
            if (this.referee.canSwap(this.board, selX, selY, x, y, currentPlayer)) {
                this.performSwap(selX, selY, x, y, clickedPiece.type);
                return;
            }
        }
        if (this.referee.isMoveValid(this.board, selX, selY, x, y, this.turn)) {
            this.performMove(selX, selY, x, y);
            return;
        }
        if (clickedPiece && clickedPiece.owner === this.turn) {
            this.selectPiece(x, y);
            return;
        }
        this.selectedPiece = null;
        this.updateView();
    }


    tryStartPlacementMode(x, y) {
        const player = this.players[this.turn];
        if (player.reserves > 0 && !this.referee.isCellForbiddenForSpawn(this.board, x, y, this.turn)) {
            this.startPlacementMode(x, y);
        }
    }

    startPlacementMode(x, y) {
        const defaultRot = (this.turn === PLAYER.P1) ? 180 : 0;
        this.pendingPlacement = { x, y, rotation: defaultRot };
        this.selectedPiece = null;
        this.updateView();
        console.log("Mode Placement activé.");
    }

    startRotationMode(x, y, piece) {
        piece.rotate();
        this.pendingRotation = { x, y };
        console.log("Mode Rotation activé : Coin pour valider, Centre pour tourner.");
        this.updateView();
    }

    performMove(fromX, fromY, toX, toY) {
        this.board.movePiece(fromX, fromY, toX, toY);
        this.finishAction();
    }

    performSwap(scarabX, scarabY, targetX, targetY, targetType) {
        const scarab = this.board.getPiece(scarabX, scarabY);
        const target = this.board.getPiece(targetX, targetY);
        this.board.setPiece(scarabX, scarabY, target);
        this.board.setPiece(targetX, targetY, scarab);
        const player = this.players[this.turn];
        player.triggerCooldown(targetType);
        if (targetType === PIECE_TYPE.SPHINX) {
            this.sphinxFiresThisTurn = false;
            console.log("Swap Sphinx : Pas de tir laser ce tour-ci.");
        }

        this.finishAction();
    }

    selectPiece(x, y) {
        this.selectedPiece = { x, y };
        const piece = this.board.getPiece(x, y);
        console.log("Sélection :", piece ? piece.type : "Vide");
        this.updateView();
    }

    handlePendingPlacement(x, y, relX, relY) {
        if (this.pendingPlacement.x !== x || this.pendingPlacement.y !== y) {
            this.pendingPlacement = null;
            this.updateView();
            return;
        }

        if (relX > 0.6 && relY > 0.6) {
            this.board.setPiece(x, y, new Piece(PIECE_TYPE.PYRAMID, this.turn, this.pendingPlacement.rotation));
            this.players[this.turn].decrementReserve();
            this.pendingPlacement = null;
            this.finishAction();
        } else {
            this.pendingPlacement.rotation = (this.pendingPlacement.rotation + 90) % 360;
            this.updateView();
        }
    }

    handlePendingRotation(x, y, relX, relY) {
        if (x !== this.pendingRotation.x || y !== this.pendingRotation.y) {
            console.log("Annulation rotation.");
            this.pendingRotation = null;
            this.selectedPiece = null;
            this.updateView();
            return;
        }
        if (relX > 0.6 && relY > 0.6) {
            this.pendingRotation = null;
            this.finishAction();
        } else {
            const p = this.board.getPiece(x, y);
            if (p) {
                p.rotate();
                this.updateView();
            }
        }
    }


    finishAction() {
        this.selectedPiece = null;
        this.pendingPlacement = null;
        this.pendingRotation = null;
        this.updateView();
        this.executeTurnSequence().catch(err => {
            console.error("Erreur critique tour :", err);
            this.isProcessingTurn = false;
        });
    }

    async executeTurnSequence() {
        this.isProcessingTurn = true;
        await (this.handlers.delay ? this.handlers.delay(300) : new Promise(r => setTimeout(r, 300)));
        if (this.sphinxFiresThisTurn) {
            this.fireLaserForCurrentTurn();
            this.updateView();
            await (this.handlers.delay ? this.handlers.delay(1500) : new Promise(r => setTimeout(r, 1500)));
        } else {
            await (this.handlers.delay ? this.handlers.delay(800) : new Promise(r => setTimeout(r, 800)));
        }
        this.switchTurn();
        this.isProcessingTurn = false;
        this.updateView();
    }

    fireLaserForCurrentTurn() {
        const currentPlayer = this.players[this.turn];
        const { hits } = LaserPhysics.getPath(this.board, currentPlayer);
        if (!hits || hits.length === 0) return;
        let deadPharaonOwner = null;
        hits.forEach(hit => {
            const target = hit.piece;
            if (this.handlers.onPieceDeathEffect) {
                this.handlers.onPieceDeathEffect(hit.x, hit.y, target.owner);
            }
            this.board.setPiece(hit.x, hit.y, null);
            if (target.type === PIECE_TYPE.PYRAMID) {
                const opponentId = (target.owner === PLAYER.P1) ? PLAYER.P2 : PLAYER.P1;
                this.players[opponentId].reserves++;
            }
            if (target.type === PIECE_TYPE.PHARAON) deadPharaonOwner = target.owner;
        });
        if (deadPharaonOwner !== null) {
            const winner = (deadPharaonOwner === PLAYER.P1) ? PLAYER.P2 : PLAYER.P1;
            if (this.handlers.onGameEnd) this.handlers.onGameEnd(winner);
        }
    }

    switchTurn() {
        this.turnCount++;
        if (this.turnCount >= 100) {
            if (this.handlers.onGameEnd) this.handlers.onGameEnd("NUL");
            return;
        }

        const nextId = (this.turn === PLAYER.P1) ? PLAYER.P2 : PLAYER.P1;
        this.players[nextId].reduceCooldowns();
        this.turn = nextId;
        this.sphinxFiresThisTurn = true;
    }


    restart() {
        this.board = new Board();
        this.board.setupStandardGame();
        this.turn = PLAYER.P1;
        this.turnCount = 0;
        this.players[1] = new HumanPlayer(PLAYER.P1);
        this.players[2] = new HumanPlayer(PLAYER.P2);
        this.selectedPiece = null;
        this.pendingPlacement = null;
        this.pendingRotation = null;
        this.isProcessingTurn = false;
        this.sphinxFiresThisTurn = true;
        this.updateView();
    }

    updateView() {
        if (this.handlers.onRenderRequest) this.handlers.onRenderRequest();
        else if (this.renderer) this.renderer.renderAll();
    }

    getBoard() { return this.board.grid; }
    getPossibleMoves(x, y) { return this.referee.getPossibleMoves(this.board, x, y); }
    getLaserPath(playerId) {
        const player = this.players[playerId];
        if (!player) return [];
        return LaserPhysics.getPath(this.board, player).path;
    }
}