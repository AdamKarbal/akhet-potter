export class Timer extends HTMLElement {
    constructor() {
        super();
        this.interval = null;
        this.timeLeft = 20;
    }

    async connectedCallback() {
        const htmlUrl = new URL('./timer.html', import.meta.url);
        const cssUrl = new URL('./timer.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;
    }

    startTimer() {
        if (this.interval) return;
        this.timeLeft = 20;
        const tryStart = () => {
            const timerContainer = this.querySelector('#timer');
            if (timerContainer) {
                timerContainer.classList.remove('inactive');
                this.updateVisuals();

                this.interval = setInterval(() => {
                    this.timeLeft--;
                    if (this.timeLeft <= 0) {
                        this.timeLeft = 0;
                        this.stopTimer();
                    }
                    this.updateVisuals();
                }, 1000);
            } else {
                setTimeout(tryStart, 50);
            }
        };

        tryStart();
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