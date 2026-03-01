import { API_URL } from '../../../config.js';

export class AuthModalComponent extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <style>
                .modal {
                    display: none;
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
                    text-align: center;
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
                    margin-top: 20px;
                }

                input {
                    padding: 10px;
                    background: #3a2a1a;
                    border: 1px solid #ffd700;
                    color: white;
                    border-radius: 4px;
                }

                .btn-hp {
                    padding: 10px;
                    cursor: pointer;
                    background: linear-gradient(to bottom, #4a3721, #2a1a0a);
                    color: #ffd700;
                    border: 2px solid #ffd700;
                    border-radius: 5px;
                    text-transform: uppercase;
                    transition: all 0.3s ease;
                }

                .btn-hp:hover {
                    box-shadow: 0 0 15px #ffd700;
                }

                .error-message {
                    color: #ff4444;
                    font-size: 0.9rem;
                    min-height: 20px;
                    margin-bottom: 10px;
                }

                h2 { color: #ffd700; margin: 0; }
            </style>

            <div id="auth-modal" class="modal">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <h2 id="modal-title">Connexion</h2>
                    <div id="error-msg" class="error-message"></div>
                    <form id="auth-form">
                        <input type="text" id="username" placeholder="Nom de sorcier" required>
                        <input type="password" id="password" placeholder="Mot de passe" required>
                        <button type="submit" class="btn-hp" style="width: 100%">Lancer le sort</button>
                    </form>
                </div>
            </div>
        `;

        this.setupLogic();
    }

    setupLogic() {
        const modal = this.querySelector('#auth-modal');
        const title = this.querySelector('#modal-title');
        const closeBtn = this.querySelector('.close-btn');
        const errorMsg = this.querySelector('#error-msg');
        const form = this.querySelector('#auth-form');
        const usernameInput = this.querySelector('#username');
        const passwordInput = this.querySelector('#password');
        closeBtn.onclick = () => this.close();
        window.onclick = (event) => {
            if (event.target == modal) this.close();
        };
        form.onsubmit = async (e) => {
            e.preventDefault();
            errorMsg.innerText = "Sort en cours de lancement...";

            const username = usernameInput.value;
            const password = passwordInput.value;
            const isLogin = title.innerText === "Se connecter";
            const endpoint = isLogin ? '/api/login' : '/api/signup';
            const url = 'API_URL' + endpoint;

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();

                if (response.ok) {
                    if (isLogin) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('username', username);
                        alert("Connexion réussie !");
                        this.close();
                    } else {
                        alert("Inscription réussie ! Connectez-vous.");
                        this.openForLogin();
                    }
                } else {
                    errorMsg.innerText = data.error || "Erreur inconnue";
                }
            } catch (err) {
                console.error(err);
                errorMsg.innerText = "Le serveur ne répond pas.";
            }
        };
    }

    openForLogin() {
        this.querySelector('#modal-title').innerText = "Se connecter";
        this.querySelector('#error-msg').innerText = "";
        this.querySelector('#auth-form').reset();
        this.querySelector('#auth-modal').style.display = 'flex';
    }

    openForRegister() {
        this.querySelector('#modal-title').innerText = "S'enregistrer";
        this.querySelector('#error-msg').innerText = "";
        this.querySelector('#auth-form').reset();
        this.querySelector('#auth-modal').style.display = 'flex';
    }

    close() {
        this.querySelector('#auth-modal').style.display = 'none';
    }
}

customElements.define('auth-modal', AuthModalComponent);