import { socket } from "../../socket.js"
import { API_URL } from "../../../config.js"

export class AuthModalComponent extends HTMLElement {
    constructor() {
        super();
        this.currentMode = 'login';
    }

    async connectedCallback() {
        const htmlUrl = new URL('./auth-modal.html', import.meta.url);
        const cssUrl = new URL('./auth-modal.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;

        this.setupLogic();
    }

    setupLogic() {
        const modal = this.querySelector('#auth-modal');
        const closeBtn = this.querySelector('.close-btn');
        const form = this.querySelector('#auth-form');
        const forgotLink = this.querySelector('#forgot-pwd-link');

        if (closeBtn) closeBtn.onclick = () => this.close();
        window.onclick = (event) => { if (event.target === modal) this.close(); };

        if (forgotLink) forgotLink.onclick = () => this.openForForgot();

        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                this.showError("Sort en cours de lancement...");

                if (this.currentMode === 'login') await this.handleLogin();
                else if (this.currentMode === 'register') await this.handleRegister();
                else if (this.currentMode === 'forgot') await this.handleGetQuestion();
                else if (this.currentMode === 'reset') await this.handleResetPassword();
            };
        }
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
                    socket.auth = { token: data.token };
                    socket.connect();
                }
                window.location.hash = '';
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
                this.openForLogin();
            } else {
                this.showError(data.error);
            }
        } catch (err) {
            this.showError("Le serveur ne répond pas.");
        }
    }

    resetFormUI() {
        const form = this.querySelector('#auth-form');
        if (form) form.reset();

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
        const loginBtn = this.querySelector('#main-btn');
        this.currentMode = 'login';
        this.resetFormUI();
        this.querySelector('#modal-title').innerText = "Se connecter";
        loginBtn.innerText = "Connexion";
        this.querySelector('#forgot-pwd-link').classList.remove('hide');

        const modal = this.querySelector('#auth-modal');
        if (modal) modal.style.display = 'flex';
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

        const modal = this.querySelector('#auth-modal');
        if (modal) modal.style.display = 'flex';
    }

    openForForgot() {
        this.currentMode = 'forgot';
        this.resetFormUI();

        this.querySelector('#modal-title').innerText = "Mot de passe oublié";
        this.querySelector('#main-btn').innerText = "Récupérer la question";
        const passwordInput = this.querySelector('#password');
        passwordInput.classList.add('hide');
        passwordInput.required = false;

        const modal = this.querySelector('#auth-modal');
        if (modal) modal.style.display = 'flex';
    }

    showError(msg) {
        const errorMsg = this.querySelector('#error-msg');
        if (errorMsg) errorMsg.innerText = msg;
    }

    close() {
        const modal = this.querySelector('#auth-modal');
        if (modal) modal.style.display = 'none';
    }
}

customElements.define('auth-modal', AuthModalComponent);