export class Timer extends HTMLElement {
    constructor() {
        super();
        this.interval = null;
        this.timeLeft = 20;
    }

    connectedCallback() {
        // language=HTML
        this.innerHTML = `
            <style>
                @font-face {
                    font-family: 'HarryPotter';
                    src: url('assets/fonts/HARRYP__.TTF') format('truetype');
                }

                #timer {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 1rem;
                }

                .img img {
                    width: 40px;
                    height: auto;
                    display: block;
                }

                .value {
                    font-family: HarryPotter;
                    font-size: 2em;
                    background: linear-gradient(to bottom, #FFF8DC 0%, #FFD700 50%, #8B4513 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
                    transition: filter 0.3s ease;
                }

                .urgent { filter: drop-shadow(0 0 8px rgba(255, 0, 0, 0.9)); }
                .inactive { opacity: 0.3; filter: grayscale(100%); }
            </style>

            <div id="timer" class="inactive">
                <div class="img"><img src="assets/timer.png"/></div>
                <div class="value">00:20</div>
            </div>
        `;
    }

    /**
     * startTimer(durationMs?)
     * - durationMs (optional): remaining milliseconds for the timer. If omitted, defaults to 20000ms.
     */
    startTimer(durationMs) {
        // If a timer is already running, restart it with the new duration (if provided)
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        // Default duration: 20s (20000ms) for backward compatibility
        let ms = typeof durationMs === 'number' && !isNaN(durationMs) ? durationMs : 20000;
        // If caller passes seconds by mistake (small number), normalize to ms
        if (ms > 0 && ms < 1000) ms = ms * 1000;

        this.timeLeft = Math.max(0, Math.ceil(ms / 1000));
        this.querySelector('#timer').classList.remove('inactive');
        this.updateVisuals();
        this.interval = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.stopTimer();
            }
            this.updateVisuals();
        }, 1000);
    }

    stopTimer() {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
        const timerContainer = this.querySelector('#timer');
        const textValue = this.querySelector('.value');
        if (timerContainer && textValue) {
            timerContainer.classList.add('inactive');
            textValue.classList.remove('urgent');
            textValue.innerText = "00:--";
        }
    }

    updateVisuals() {
        const textValue = this.querySelector('.value');
        if (!textValue) return;
        const seconds = this.timeLeft < 10 ? `0${this.timeLeft}` : this.timeLeft;
        textValue.innerText = `00:${seconds}`;
        if (this.timeLeft <= 5) {
            textValue.classList.add('urgent');
        } else {
            textValue.classList.remove('urgent');
        }
    }
}

customElements.define('player-timer', Timer);