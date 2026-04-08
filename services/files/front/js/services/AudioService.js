class AudioService {
    constructor() {
        this.mainTheme = new Audio("../../assets/sounds/mainmenu.mp3");
        this.inGameTheme = new Audio("../../assets/sounds/ingame.mp3");
        this.inGameTheme.loop = true;
        this.inGameTheme.volume = 0.5;
        this.mainTheme.loop = true;
        this.mainTheme.volume = 0.5;
        this.isMainThemePlayed = false;
        this.isIngameThemePlayed = false;
    }

    playMainTheme() {
        if(!this.isMainThemePlayed) this.mainTheme.play();
        this.isMainThemePlayed = true;
    }

    stopMainTheme(){
        if(this.isMainThemePlayed){
            this.mainTheme.pause();
            this.mainTheme.currentTime = 0;
        }
        this.isMainThemePlayed = false;
    }

    playEffect(name) {
        const effect = new Audio(`../../assets/sounds/${name}.mp3`);
        effect.play();
    }

    playInGameTheme(){
        if(!this.isIngameThemePlayed) this.inGameTheme.play();
        this.isIngameThemePlayed = true;
    }

    stopInGameTheme(){
        if(this.isIngameThemePlayed){
            this.inGameTheme.pause();
            this.inGameTheme.currentTime = 0;
        }
        this.isIngameThemePlayed = false;
    }
}

export const audioService = new AudioService();