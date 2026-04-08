import '../global-chat-component/global-chat-component.js'

export class NavbarComponent extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./navbar-component.html', import.meta.url);
        const cssUrl = new URL('./navbar-component.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const btnChat = this.querySelector('#btn-globalchat');
        const globalChatModal = this.querySelector('#my-global-chat');

        if (btnChat && globalChatModal) {
            btnChat.onclick = () => {
                globalChatModal.toggle();
            };
        }

        const socialBtn = this.querySelector('#social-btn');
        if (socialBtn) {
            socialBtn.addEventListener('click', () => {
                window.location.hash = 'SOC';
            });
        }

        const requBtn = this.querySelector('#request-btn');
        if (requBtn) {
            requBtn.addEventListener('click', () => {
                window.location.hash = 'REQ';
            });
        }

        const achievementbtn = this.querySelector('#achievement-btn');
        if (achievementbtn) {
            achievementbtn.addEventListener('click', () => {
                window.location.hash = 'SUCCES';
            });
        }

        const playBtn = this.querySelector("#play-btn");
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                window.location.hash = '';
            });
        }

        const helpBtn = this.querySelector('#help');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                window.location.hash = 'HELP';
            });
        }

        const settingsBtn = this.querySelector('.navElem img[alt="Réglages"]').parentElement;
        if (settingsBtn) {
            settingsBtn.onclick = () => {
                window.location.hash = 'SETTINGS';
            };
        }

        const logoutBtn = this.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                const token = localStorage.getItem('token');
                try {
                    const response = await fetch("/api/logout", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        window.location.hash = 'LGN';
                        localStorage.clear();
                        window.location.reload();
                    }
                } catch (error) {
                    console.log("Erreur lors de la déconnexion: ", error);
                }
            });
        }
    }
}

customElements.define('navbar-component', NavbarComponent);