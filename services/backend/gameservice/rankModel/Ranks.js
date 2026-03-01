export class Ranks {
    constructor(year, elo){
        this.year = year;
        this.elo = elo;
    }

    getElo(){
        return this.elo;
    }

    getYear(){
        return this.year;
    }
}