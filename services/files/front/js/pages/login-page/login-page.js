import '../../components/player-layout/player-layout.js'
import '../../components/navbar-component/navbar-component.js'
import '../../components/auth-modal/auth-modal.js'

export class LoginComponent extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./login-page.html', import.meta.url);
        const cssUrl = new URL('./login-page.css', import.meta.url);
        
        try {
            const [htmlResponse] = await Promise.all([
                fetch(htmlUrl)
            ]);

            const html = await htmlResponse.text();

            this.innerHTML = `
                <link rel="stylesheet" href="${cssUrl.href}">
                ${html}
            `;

            this.setupEventListeners();
        } catch (error) {
            console.error("Failed to load login page resources:", error);
        }
    }

    setupEventListeners() {
        const authModal = this.querySelector('#my-auth-modal');
        const btnRegister = this.querySelector('#btn-register');
        const btnLogin = this.querySelector('#btn-login');

        if (btnRegister && authModal) {
            btnRegister.onclick = () => {
                authModal.openForRegister();
            };
        }

        if (btnLogin && authModal) {
            btnLogin.onclick = () => {
                authModal.openForLogin();
            };
        }
    }
}

customElements.define('login-page', LoginComponent);