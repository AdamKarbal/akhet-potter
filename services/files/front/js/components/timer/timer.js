export class Timer extends HTMLElement {
    constructor() {
        super();
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
                    width: 40px; /* Force une taille fixe (ajuste selon tes besoins) */
                    height: auto; /* Garde les proportions */
                    display: block; /* Supprime l'espace fantôme sous l'image */
                }

                .value {
                    font-family: HarryPotter;
                    color: #c5a059;
                    font-size: 2em;
                    font-family: HarryPotter;
                    color: #c5a059;
                    font-size: 2em;
                    background: linear-gradient(
                            to bottom,
                            #FFF8DC 0%,
                            #FFD700 50%,
                            #8B4513 100%
                    );
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
                }

            </style>
            <div id="timer">
                <div class="img">
                    <img src="assets/timer.png"/>
                </div>
                <div class="value">00:20</div>
            </div>

        `;
    }
}

customElements.define('player-timer', Timer);