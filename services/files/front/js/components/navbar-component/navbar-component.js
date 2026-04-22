import '../global-chat-component/global-chat-component.js'
import {API_URL} from "../../../config.js";

export class NavbarComponent extends HTMLElement {
    constructor() {
        super();
        this.selectedSection = null;
    }

    static HASH_TO_BTN = {
        'SOC':    '#social-btn',
        'REQ':    '#request-btn',
        'SUCCES': '#achievement-btn',
        'HELP':   '#help',
        'SETTINGS': '#reglages',
        '':       '#play-btn',
    };

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

        this._onHashChange = () => this.updateActiveBtn();
        window.addEventListener('hashchange', this._onHashChange);
        this.updateActiveBtn();
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
                    const response = await fetch(API_URL + "/api/logout", {
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

    updateActiveBtn() {
        const hash = window.location.hash.replace('#', '');
        const targetId = NavbarComponent.HASH_TO_BTN[hash] ?? null;

        const allBtns = this.querySelectorAll('#play-btn, #social-btn, #request-btn, #achievement-btn, #help, #reglages, #btn-globalchat');
        allBtns.forEach(btn => btn.classList.remove('active'));

        if (targetId) {
            const activeBtn = this.querySelector(targetId);
            if (activeBtn) activeBtn.classList.add('active');
        }
    }

    disconnectedCallback() {
        window.removeEventListener('hashchange', this._onHashChange);
    }
}

customElements.define('navbar-component', NavbarComponent);