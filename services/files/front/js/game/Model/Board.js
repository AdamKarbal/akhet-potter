import {PLAYER, PIECE_TYPE, DIRECTION, Piece} from "./model.js";


export class Board {

    constructor() {
        this.grid = Array(10).fill(null).map(() => Array(10).fill(null));
    }

    getPiece(x, y) {
        if (!this.isValid(x, y)) return null;
        return this.grid[x][y];
    }

    setPiece(x, y, piece) {
        if (this.isValid(x, y)) this.grid[x][y] = piece;
    }

    movePiece(fromX, fromY, toX, toY) {
        const piece = this.getPiece(fromX, fromY);
        this.setPiece(toX, toY, piece);
        this.setPiece(fromX, fromY, null);
    }

    isValid(x, y) {
        return x >= 0 && x < 10 && y >= 0 && y < 10;
    }

    setupStandardGame() {
        const sphinxCol = Math.floor(Math.random() * 10);
        const sphinxRot = (sphinxCol < 5) ? DIRECTION.RIGHT : DIRECTION.LEFT;
        this.setPiece(sphinxCol, 0, new Piece(PIECE_TYPE.SPHINX, PLAYER.P1, sphinxRot));
        const forbiddenCols = [0, 9, sphinxCol, 9 - sphinxCol];
        let pharaonCol;
        do {
            pharaonCol = Math.floor(Math.random() * 10); }
        while (forbiddenCols.includes(pharaonCol));
        this.setPiece(pharaonCol, 2, new Piece(PIECE_TYPE.PHARAON, PLAYER.P1, DIRECTION.DOWN));
        this.setPiece(pharaonCol, 4, new Piece(PIECE_TYPE.ANUBIS, PLAYER.P1, DIRECTION.DOWN));
        this.setPiece(9 - sphinxCol, 2, new Piece(PIECE_TYPE.ANUBIS, PLAYER.P1, DIRECTION.DOWN));
        let scarabCol;
        do { scarabCol = Math.floor(Math.random() * 10); } while (this.getPiece(scarabCol, 3) !== null);
        const randomRot = [0, 90][Math.floor(Math.random() * 2)];
        this.setPiece(scarabCol, 3, new Piece(PIECE_TYPE.SCARAB, PLAYER.P1, randomRot));
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 5; y++) {
                const p1Piece = this.getPiece(x, y);
                if (p1Piece && p1Piece.owner === PLAYER.P1) {
                    const p2Rot = (p1Piece.rotation + 180) % 360;
                    this.setPiece(9 - x, 9 - y, new Piece(p1Piece.type, PLAYER.P2, p2Rot));
                }
            }
        }
    }
}