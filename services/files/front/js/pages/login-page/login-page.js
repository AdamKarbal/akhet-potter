import '../../components/player-layout/player-layout.js'
import '../../components/moves-component/moves-component.js'
import '../../components/chat-component/chat-component.js'
import '../../components/navbar-component/navbar-component.js'
import '../../components/GameBoard/GameBoard.js'
import '../../components/quit-component/quit-component.js'

export class LoginComponent extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <style>
                body {
                    background-image: url("assets/background1v1.png");
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
                    background-image: url("assets/map.jpg");
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

                /* --- STYLE DE LA MODALE (LE FORMULAIRE) --- */
                .modal {
                    display: none; /* Caché par défaut */
                    position: fixed;
                    z-index: 100;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.8);
                    backdrop-filter: blur(5px);
                    justify-content: center;
                    align-items: center;
                }

                .modal-content {
                    background: #2a1a0a;
                    border: 3px solid #ffd700;
                    padding: 40px;
                    width: 350px;
                    border-radius: 10px;
                    position: relative;
                    box-shadow: 0 0 50px #000;
                    animation: spell-appear 0.5s ease-out;
                }

                @keyframes spell-appear {
                    from { transform: scale(0.5); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .close-btn {
                    position: absolute;
                    right: 15px;
                    top: 10px;
                    color: #ffd700;
                    cursor: pointer;
                    font-size: 24px;
                }

                form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                input {
                    padding: 10px;
                    background: #3a2a1a;
                    border: 1px solid #ffd700;
                    color: white;
                    border-radius: 4px;
                }

                h2 { color: #ffd700; margin-top: 0; }
            </style>
            
            <div class="container">
                <navbar-component id="nav"></navbar-component>
                
                <div id="board-preview">
                    <div class="placeholder-board"></div>
                </div>

                <div id="right-aside">
                    <img src="assets/logo.png" style="max-width:400px">
                    <p>Jouer au jeu KHET #1 sous le thème Harry Potter</p>
                    <div class="button-group">
                        <button class="btn-hp" id="btn-register">S'enregistrer</button>
                        <br><br>
                        <button class="btn-hp" id="btn-login">Se connecter</button>
                    </div>
                </div>
            </div>

            <div id="auth-modal" class="modal">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <h2 id="modal-title">Connexion</h2>
                    <form id="auth-form">
                        <input type="text" placeholder="Nom de sorcier" required>
                        <input type="password" placeholder="Mot de passe" required>
                        <button type="submit" class="btn-hp" style="width: 100%">Lancer le sort</button>
                    </form>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const modal = this.querySelector('#auth-modal');
        const title = this.querySelector('#modal-title');
        const closeBtn = this.querySelector('.close-btn');

        this.querySelector('#btn-register').onclick = () => {
            title.innerText = "S'enregistrer";
            modal.style.display = 'flex';
        };

        this.querySelector('#btn-login').onclick = () => {
            title.innerText = "Se connecter";
            modal.style.display = 'flex';
        };

        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == modal) modal.style.display = 'none';
        };
    }
}

customElements.define('login-page', LoginComponent);