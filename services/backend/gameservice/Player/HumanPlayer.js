import {Player} from "./Player.js";
import { Ranks } from "../rankModel/Ranks.js";

export class HumanPlayer extends Player {

    constructor(id, rank) {
        super(id, `Joueur Humain ${id}`);
        this.rank = rank;
    }

    getElo(){
        return this.rank.getElo();
    }

    getYear(){
        return this.rank.getYear();
    }
}