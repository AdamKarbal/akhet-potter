import {Player} from "./Player.js";

export class HumanPlayer extends Player {

    constructor(id) {
        super(id, `Joueur Humain ${id}`);
    }
}