export class SettingsPage extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
        <style>
            @font-face {
                font-family: 'HarryPotter';
                src: url('/assets/fonts/HARRYP__.TTF') format('truetype');
            }
            
             html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden; /* Empêche le scroll parasite sur les bords */
                background-color: #140f0a; /* La couleur sombre de ton thème */
            }

        * {
            box-sizing: border-box; /* Évite que les bordures agrandissent les éléments */
        }

            .settings-container {
                display: grid;
                grid-template-columns: 70px 1fr; /* Aligné sur la nouvelle largeur navbar */
                width: 100vw;
                height: 100vh;
                background-image: url("/assets/background1v1.png");
                background-size: 100% 100%;
                background-repeat: no-repeat;
            }

            .main-content {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .settings-card {
                background-color: rgba(20, 15, 10, 0.9);
                border: 2px double #c5a059;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.5);
                padding: 40px 80px;
                text-align: center;
                color: #FFD700;
            }

            h1 {
                font-family: 'HarryPotter', sans-serif;
                font-size: 4em;
                margin: 0;
            }

            .info {
                font-family: 'Agency FB', sans-serif;
                font-size: 1.8em;
                margin-top: 10px;
                letter-spacing: 2px;
                text-transform: uppercase;
            }
        </style>

        <div class="settings-container">
            <navbar-component id="nav"></navbar-component>
            <div class="main-content">
                <div class="settings-card">
                    <h1>Réglages</h1>
                    <div class="info">Bientôt disponible</div>
                </div>
            </div>
        </div>
        `;
    }
}

customElements.define('settings-page', SettingsPage);