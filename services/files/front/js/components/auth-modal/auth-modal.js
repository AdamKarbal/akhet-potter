import { socket } from "../../socket.js"
import { API_URL } from "../../../config.js"

export class AuthModalComponent extends HTMLElement {
    constructor() {
        super();
        this.currentMode = 'login';
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
                    font-family: 'Georgia', serif;
                    color: white;
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

                .btn-hp:hover { box-shadow: 0 0 15px #ffd700; }

                .error-message {
                    color: #ff4444;
                    font-size: 0.9rem;
                    min-height: 20px;
                    margin-bottom: 10px;
                }

                h2 { color: #ffd700; margin: 0; }
                
                #forgot-pwd-link {
                    color: #c5a059;
                    font-size: 0.8rem;
                    text-decoration: underline;
                    cursor: pointer;
                    margin-top: -5px;
                }
                
                #forgot-pwd-link:hover { color: #ffd700; }

                .hide { display: none !important; }
                
                #security-question-display {
                    color: #ffd700;
                    font-style: italic;
                    margin-bottom: 10px;
                }
            </style>

            <div id="auth-modal" class="modal">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <h2 id="modal-title">Connexion</h2>
                    <div id="error-msg" class="error-message"></div>
                    
                    <form id="auth-form">
                        <input type="text" id="username" placeholder="Nom de sorcier" required>
                        <input type="password" id="password" placeholder="Mot de passe" required>
                        
                        <input type="text" id="reg-question" class="reg-only hide" placeholder="Question secrète (ex: Mon 1er balai ?)">
                        <input type="text" id="reg-answer" class="reg-only hide" placeholder="Réponse secrète">
                        
                        <p id="security-question-display" class="reset-only hide"></p>
                        <input type="text" id="forgot-answer" class="reset-only hide" placeholder="Votre réponse">
                        <input type="password" id="forgot-new-password" class="reset-only hide" placeholder="Nouveau mot de passe">

                        <button type="submit" id="main-btn" class="btn-hp" style="width: 100%">Lancer le sort</button>
                    </form>
                    
                    <p id="forgot-pwd-link" class="login-only">Mot de passe oublié ?</p>
                </div>
            </div>
        `;

        this.setupLogic();
    }

    setupLogic() {
        const modal = this.querySelector('#auth-modal');
        const closeBtn = this.querySelector('.close-btn');
        const form = this.querySelector('#auth-form');
        const forgotLink = this.querySelector('#forgot-pwd-link');

        closeBtn.onclick = () => this.close();
        window.onclick = (event) => { if (event.target == modal) this.close(); };

        forgotLink.onclick = () => this.openForForgot();

        form.onsubmit = async (e) => {
            e.preventDefault();
            this.showError("Sort en cours de lancement...");

            if (this.currentMode === 'login') await this.handleLogin();
            else if (this.currentMode === 'register') await this.handleRegister();
            else if (this.currentMode === 'forgot') await this.handleGetQuestion();
            else if (this.currentMode === 'reset') await this.handleResetPassword();
        };
    }

    async handleLogin() {
        const username = this.querySelector('#username').value;
        const password = this.querySelector('#password').value;

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', username);
                if (socket) {
                    socket.auth.token = data.token;
                    socket.connect();
                }
                window.location.hash = ''; // Redirection vers l'accueil
                this.close();
            } else {
                this.showError(data.error);
            }
        } catch (err) {
            this.showError("Le serveur ne répond pas.");
        }
    }

    async handleRegister() {
        const username = this.querySelector('#username').value;
        const password = this.querySelector('#password').value;
        const securityQuestion = this.querySelector('#reg-question').value;
        const securityAnswer = this.querySelector('#reg-answer').value;

        try {
            const response = await fetch(`${API_URL}/api/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, securityQuestion, securityAnswer })
            });
            const data = await response.json();

            if (response.ok) {
                alert("Inscription réussie ! Vous pouvez vous connecter.");
                this.openForLogin();
            } else {
                this.showError(data.error);
            }
        } catch (err) {
            this.showError("Le serveur ne répond pas.");
        }
    }

    async handleGetQuestion() {
        const username = this.querySelector('#username').value;
        if (!username) return this.showError("Veuillez entrer un nom de sorcier.");

        try {
            const response = await fetch(`${API_URL}/api/security-question?username=${username}`);
            const data = await response.json();

            if (response.ok) {
                this.currentMode = 'reset';
                this.querySelector('#security-question-display').innerText = `Question : ${data.question}`;
                this.querySelector('#username').classList.add('hide');
                this.querySelector('#password').classList.add('hide');
                this.querySelectorAll('.reset-only').forEach(el => el.classList.remove('hide'));
                this.querySelector('#forgot-answer').required = true;
                this.querySelector('#forgot-new-password').required = true;
                this.querySelector('#modal-title').innerText = "Réinitialiser";
                this.querySelector('#main-btn').innerText = "Changer le mot de passe";
                this.showError("");
            } else {
                this.showError(data.error);
            }
        } catch (err) {
            this.showError("Le serveur ne répond pas.");
        }
    }

    async handleResetPassword() {
        const username = this.querySelector('#username').value;
        const answer = this.querySelector('#forgot-answer').value;
        const newPassword = this.querySelector('#forgot-new-password').value;

        try {
            const response = await fetch(`${API_URL}/api/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, securityAnswer: answer, newPassword })
            });
            const data = await response.json();

            if (response.ok) {
                alert("Mot de passe modifié avec succès !");
                this.openForLogin(); // Retour au menu login
            } else {
                this.showError(data.error);
            }
        } catch (err) {
            this.showError("Le serveur ne répond pas.");
        }
    }


    resetFormUI() {
        this.querySelector('#auth-form').reset();
        this.showError("");
        this.querySelector('#username').classList.remove('hide');
        this.querySelector('#username').required = true;

        this.querySelector('#password').classList.remove('hide');
        this.querySelector('#password').required = true;

        this.querySelectorAll('.reg-only, .reset-only').forEach(el => {
            el.classList.add('hide');
            el.required = false;
        });
        this.querySelector('#forgot-pwd-link').classList.add('hide');
    }

    openForLogin() {
        this.currentMode = 'login';
        this.resetFormUI();
        this.querySelector('#modal-title').innerText = "Se connecter";
        this.querySelector('#main-btn').innerText = "Connexion";
        this.querySelector('#forgot-pwd-link').classList.remove('hide');
        this.querySelector('#auth-modal').style.display = 'flex';
    }

    openForRegister() {
        this.currentMode = 'register';
        this.resetFormUI();
        this.querySelector('#modal-title').innerText = "S'enregistrer";
        this.querySelector('#main-btn').innerText = "Créer mon sorcier";
        const regFields = this.querySelectorAll('.reg-only');
        regFields.forEach(el => {
            el.classList.remove('hide');
            el.required = true;
        });

        this.querySelector('#auth-modal').style.display = 'flex';
    }

    openForForgot() {
        this.currentMode = 'forgot';
        this.resetFormUI();

        this.querySelector('#modal-title').innerText = "Mot de passe oublié";
        this.querySelector('#main-btn').innerText = "Récupérer la question";
        const passwordInput = this.querySelector('#password');
        passwordInput.classList.add('hide');
        passwordInput.required = false;

        this.querySelector('#auth-modal').style.display = 'flex';
    }

    showError(msg) {
        this.querySelector('#error-msg').innerText = msg;
    }

    close() {
        this.querySelector('#auth-modal').style.display = 'none';
    }
}
customElements.define('auth-modal', AuthModalComponent);