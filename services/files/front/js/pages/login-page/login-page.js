import '../../components/player-layout/player-layout.js'
import '../../components/navbar-component/navbar-component.js'
import '../../components/auth-modal/auth-modal.js'

export class LoginComponent extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <style>
                body {
                    background-image: url("/assets/background1v1.webp");
                    background-size: cover;
                    background-position: center;
                    min-height: 100vh;
                    margin: 0;
                    font-family: 'Georgia', serif;
                    color: #e0d2b4;
                    overflow: hidden;
                }
                
                .container {
                    display: grid;
                    grid-template-columns: 80px 1fr 1fr;
                    grid-template-rows: 100vh;
                    align-items: center;
                }
                
                #nav { grid-column: 1; height: 100%; }

                #board-preview {
                    grid-column: 2;
                    display: flex;
                    justify-content: center;
                    padding: 20px;
                }

                .placeholder-board {
                    width: 85%;
                    aspect-ratio: 1 / 1;
                    border: 12px solid #3a2a1a;
                    box-shadow: 0 0 40px rgba(0,0,0,0.9);
                    background-image: url("assets/map.webp");
                    background-size: cover;
                    border-radius: 5px;
                }

                #right-aside {
                    grid-column: 3;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    align-items: center;
                    text-align: center;
                }

                .btn-hp {
                    padding: 15px 35px;
                    font-size: 1.1rem;
                    cursor: pointer;
                    background: linear-gradient(to bottom, #4a3721, #2a1a0a);
                    color: #ffd700;
                    border: 2px solid #ffd700;
                    border-radius: 5px;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                    width: 220px;
                }

                .btn-hp:hover {
                    box-shadow: 0 0 15px #ffd700;
                    transform: scale(1.05);
                }
            </style>
            
            <div class="container">
                <navbar-component id="nav"></navbar-component>
                
                <div id="board-preview">
                    <div class="placeholder-board"></div>
                </div>

                <div id="right-aside">
                    <img src="assets/logo.webp" style="max-width:400px">
                    <p>Jouer au jeu KHET #1 sous le thème Harry Potter</p>
                    <div class="button-group">
                        <button class="btn-hp" id="btn-register">S'enregistrer</button>
                        <br><br>
                        <button class="btn-hp" id="btn-login">Se connecter</button>
                    </div>
                </div>
            </div>

            <auth-modal id="my-auth-modal"></auth-modal>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const authModal = this.querySelector('#my-auth-modal');
        this.querySelector('#btn-register').onclick = () => {
            authModal.openForRegister();
        };

        this.querySelector('#btn-login').onclick = () => {
            authModal.openForLogin();
        };
    }
}

customElements.define('login-page', LoginComponent);