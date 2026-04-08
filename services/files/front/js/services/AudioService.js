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
        if(!this.isMainThemePlayed) {
            const playPromise = this.mainTheme.play();
            // On attrape l'erreur si le navigateur bloque l'autoplay
            if (playPromise !== undefined) {
                playPromise.catch(error => console.warn("L'audio attend une interaction utilisateur pour démarrer."));
            }
        }
        this.isMainThemePlayed = true;
    }

    stopMainTheme() {
        if(this.isMainThemePlayed) {
            this.mainTheme.pause();
            this.mainTheme.currentTime = 0;
        }
        this.isMainThemePlayed = false;
    }

    playInGameTheme(){
        if(!this.isIngameThemePlayed) {
            const playPromise = this.inGameTheme.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => console.warn("L'audio attend une interaction utilisateur pour démarrer."));
            }
        }
        this.isIngameThemePlayed = true;
    }

    playEffect(name) {
        const effect = new Audio(`../../assets/sounds/${name}.mp3`);
        const playPromise = effect.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {}); // On ignore silencieusement
        }
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