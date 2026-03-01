export const PLAYER = {
    P1: 1,
    P2: 2
};

export const PIECE_TYPE = {
    SPHINX:'sphinx',
    PHARAON:'pharaon',
    ANUBIS:'anubis',
    PYRAMID:'pyramid',
    SCARAB:'scarab'
}

export const DIRECTION = {
    UP:0,
    RIGHT:90,
    DOWN:180,
    LEFT:270
}

export class Piece {
    constructor(type, owner, rotation){
        this.type = type;
        this.owner = owner;
        this.rotation = rotation;
    }

    rotate(direction = 90){
        this.rotation = (this.rotation + direction) % 360;
    }
}