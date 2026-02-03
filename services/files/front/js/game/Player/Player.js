export class Player {

    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.reserves = 7; // Pyramides
        this.cooldowns = { sphinx: 0, pharaon: 0 };
    }

    decrementReserve() {
        if (this.reserves > 0) this.reserves--;
    }

    isActionAllowed(type) {
        return this.cooldowns[type] === 0;
    }

    triggerCooldown(type) {
        this.cooldowns[type] = 5; 
    }

    reduceCooldowns() {
        if (this.cooldowns.sphinx > 0) this.cooldowns.sphinx--;
        if (this.cooldowns.pharaon > 0) this.cooldowns.pharaon--;
    }
}