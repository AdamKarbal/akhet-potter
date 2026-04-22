class AudioService {
    constructor() {
        this.storageKey = "musicVolume";
        this.mainTheme = new Audio("../../assets/sounds/mainmenu.mp3");
        this.inGameTheme = new Audio("../../assets/sounds/ingame.mp3");
        this.mainTheme.preload = "auto";
        this.inGameTheme.preload = "auto";
        this.mainTheme.setAttribute("playsinline", "");
        this.inGameTheme.setAttribute("playsinline", "");
        this.inGameTheme.loop = true;
        this.mainTheme.loop = true;
        this.isMainThemePlayed = false;
        this.isIngameThemePlayed = false;
        this._retryTimeout = null;

        const savedVolume = Number(localStorage.getItem(this.storageKey));
        const initialVolume = Number.isFinite(savedVolume) ? savedVolume : 0.5;
        this.setMusicVolume(initialVolume);

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState !== "visible") return;
            if (this.isMainThemePlayed) this.playMainTheme();
            if (this.isIngameThemePlayed) this.playInGameTheme();
        });

        document.addEventListener("resume", () => {
            if (this.isMainThemePlayed) this.playMainTheme();
            if (this.isIngameThemePlayed) this.playInGameTheme();
        });
    }

    playMainTheme() {
        if (!this.isMainThemePlayed) {
            this._playWithRetry(this.mainTheme);
        }
        this.isMainThemePlayed = true;
    }

    stopMainTheme() {
        if (this.isMainThemePlayed) {
            this.mainTheme.pause();
            this.mainTheme.currentTime = 0;
        }
        this.isMainThemePlayed = false;
    }

    playInGameTheme() {
        if (!this.isIngameThemePlayed) {
            this._playWithRetry(this.inGameTheme);
        }
        this.isIngameThemePlayed = true;
    }

    playEffect(name) {
        const effect = new Audio(`../../assets/sounds/${name}.mp3`);
        const playPromise = effect.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
    }

    stopInGameTheme() {
        if (this.isIngameThemePlayed) {
            this.inGameTheme.pause();
            this.inGameTheme.currentTime = 0;
        }
        this.isIngameThemePlayed = false;
    }

    setMusicVolume(volume) {
        const normalizedVolume = Math.min(1, Math.max(0, Number(volume) || 0));
        this.mainTheme.volume = normalizedVolume;
        this.inGameTheme.volume = normalizedVolume;
        localStorage.setItem(this.storageKey, String(normalizedVolume));
    }

    getMusicVolume() {
        return this.mainTheme.volume;
    }

    _isMobileApp() {
        const capacitor = typeof window !== "undefined" ? window.Capacitor : undefined;
        if (capacitor && typeof capacitor.getPlatform === "function") {
            return capacitor.getPlatform() === "android" || capacitor.getPlatform() === "ios";
        }
        return document.body.classList.contains("is-android");
    }

    _playWithRetry(audio) {
        const playPromise = audio.play();
        if (playPromise === undefined) return;

        playPromise.catch(() => {
            if (!this._isMobileApp()) {
                console.warn("L'audio attend une interaction utilisateur pour demarrer.");
                return;
            }

            clearTimeout(this._retryTimeout);
            this._retryTimeout = setTimeout(() => {
                audio.play().catch(() => {});
            }, 400);
        });
    }
}

export const audioService = new AudioService();
