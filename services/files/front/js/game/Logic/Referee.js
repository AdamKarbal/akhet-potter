import { PIECE_TYPE } from "../Model/model.js";

export class Referee {
    isMoveValid(board, fromX, fromY, toX, toY, currentPlayerId) {
        if (!board.isValid(toX, toY)) return false;
        const piece = board.getPiece(fromX, fromY);
        if (!piece || piece.owner !== currentPlayerId) return false;
        if (piece.type === PIECE_TYPE.SPHINX || piece.type === PIECE_TYPE.PHARAON) return false;
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);
        if (dx + dy !== 1) return false;
        return board.getPiece(toX, toY) === null;
    }

    getPossibleMoves(board, x, y) {
        const piece = board.getPiece(x, y);
        if (!piece || piece.type === PIECE_TYPE.SPHINX || piece.type === PIECE_TYPE.PHARAON) return [];
        const moves = [];
        const deltas = [{dx:0, dy:1}, {dx:0, dy:-1}, {dx:1, dy:0}, {dx:-1, dy:0}];
        for (const d of deltas) {
            const tx = x + d.dx;
            const ty = y + d.dy;
            if (board.isValid(tx, ty) && board.getPiece(tx, ty) === null) {
                moves.push({ x: tx, y: ty });
            }
        }
        return moves;
    }

    isCellForbiddenForSpawn(board, x, y, currentPlayerId) {
        const neighbors = [
            {x: x+1, y: y}, {x: x-1, y: y},
            {x: x, y: y+1}, {x: x, y: y-1}
        ];
        for (const n of neighbors) {
            if (!board.isValid(n.x, n.y)) continue;
            const piece = board.getPiece(n.x, n.y);
            if (!piece) continue;
            if (piece.type === PIECE_TYPE.SPHINX) return true;
            if (piece.type === PIECE_TYPE.PHARAON && piece.owner === currentPlayerId) return true;
        }
        return false;
    }

    canSwap(board, scarabX, scarabY, targetX, targetY, player) {
        const scarab = board.getPiece(scarabX, scarabY);
        const target = board.getPiece(targetX, targetY);
        if (!scarab || scarab.type !== PIECE_TYPE.SCARAB) return false;
        if (!target) return false;
        if (target.type !== PIECE_TYPE.SPHINX && target.type !== PIECE_TYPE.PHARAON) return false;
        return player.isActionAllowed(target.type);
    }
}
