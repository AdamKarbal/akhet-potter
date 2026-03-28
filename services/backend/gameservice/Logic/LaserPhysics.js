import { PIECE_TYPE } from "../Model/model.js";
import {MOVEMENT_DELTAS, SCARAB_BACKSLASH, SCARAB_SLASH, PYRAMID_REFLECTIONS} from '../Model/ReflectionHelper.js'

export class LaserPhysics {

    static makeCellKey(x, y) {
        return `${x},${y}`;
    }

    static getPath(board, player) {
        const sphinxData = this.findSphinx(board, player.id);
        if (!sphinxData) return { path: [], hits: [] };
        const path = [];
        const hits = [];
        const destroyedCells = new Set();
        let { x: cx, y: cy } = sphinxData;
        let dir = sphinxData.piece.rotation;
        for (let step = 0; step < 100; step++) {
            path.push({ x: cx, y: cy, direction: dir });
            const delta = MOVEMENT_DELTAS[dir];
            cx += delta.dx;
            cy += delta.dy;
            if (!board.isValid(cx, cy)) {
                path.push({ x: cx, y: cy, direction: dir });
                break;
            }

            const cellKey = this.makeCellKey(cx, cy);
            const piece = destroyedCells.has(cellKey) ? null : board.getPiece(cx, cy);
            if (piece) {
                path.push({ x: cx, y: cy, direction: dir });
                const result = this.calculateReflection(piece, dir);
                if (result === 'BLOCK') break;
                if (result === 'HIT') {
                    hits.push({ x: cx, y: cy, piece });
                    destroyedCells.add(cellKey);
                    continue;
                }
                dir = result;
            }
        }
        return { path, hits };
    }

    static findSphinx(board, playerId) {
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                const piece = board.getPiece(x, y);
                if (piece && piece.type === PIECE_TYPE.SPHINX && piece.owner === playerId) {
                    return { x, y, piece };
                }
            }
        }
        return null;
    }


    static calculateReflection(piece, incomingDir) {

        switch (piece.type) {
            case PIECE_TYPE.SCARAB:
                const isBackSlash = (piece.rotation === 0 || piece.rotation === 180);
                const map = isBackSlash ? SCARAB_BACKSLASH : SCARAB_SLASH;
                return map[incomingDir];

            case PIECE_TYPE.PYRAMID:
                const reflectionMap = PYRAMID_REFLECTIONS[piece.rotation];

                return (reflectionMap && reflectionMap[incomingDir] !== undefined)
                    ? reflectionMap[incomingDir]
                    : 'HIT';
            case PIECE_TYPE.ANUBIS:
                const hitFromFront = piece.rotation === (incomingDir + 180) % 360;
                return hitFromFront ? 'BLOCK' : 'HIT';

            case PIECE_TYPE.SPHINX:
                return 'BLOCK';

            case PIECE_TYPE.PHARAON:
                return 'HIT';

            default:
                return 'HIT';
        }
    }
}