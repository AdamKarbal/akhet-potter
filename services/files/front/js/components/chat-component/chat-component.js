import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
import { API_URL } from "../../../config.js";

export class ChatComponent extends HTMLElement {
    constructor() {
        super();
        this.socket = null;
        this.gameId = null;
        this.isMuted = false;
    }

    async connectedCallback() {
        const htmlUrl = new URL('./chat-component.html', import.meta.url);
        const cssUrl = new URL('./chat-component.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;

        this.initSocket();
        this.setupEventListeners();
    }

    initSocket() {
        const token = localStorage.getItem("token");
        if (!token) return;

        this.socket = io(API_URL, {
            path: "/social.io",
            transports: ["websocket"],
            auth: { token: token }
        });

        this.socket.on('ingame_message_receive', (data) => {
            if (this.isMuted) return;

            const history = this.querySelector('#chatContent');
            if (!history) return;

            const msgDiv = document.createElement('div');
            msgDiv.innerHTML = `<span style="color:#e74c3c"><b>${data.sender}:</b></span> ${data.message}`;
            history.appendChild(msgDiv);
            history.scrollTop = history.scrollHeight;
        });
    }

    setGameId(id) {
        this.gameId = id;
        if (this.socket) {
            this.socket.emit('join_game_chat', this.gameId);
            const history = this.querySelector('#chatContent');
            if (history) {
                history.innerHTML = `<div style="color: #aaa; font-style: italic; text-align: center;">Que le duel commence !</div>`;
            }
        }
    }

    setupEventListeners() {
        const history = this.querySelector('#chatContent');
        const muteCheckbox = this.querySelector('#mute-checkbox');
        const buttons = this.querySelectorAll('.qc-btn');

        if (muteCheckbox) {
            muteCheckbox.addEventListener('change', (e) => {
                this.isMuted = e.target.checked;
            });
        }

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const msg = btn.getAttribute('data-msg');

                if (history) {
                    const msgDiv = document.createElement('div');
                    msgDiv.innerHTML = `<span style="color:#d4af37"><b>Moi:</b></span> ${msg}`;
                    history.appendChild(msgDiv);
                    history.scrollTop = history.scrollHeight;
                }

                if (this.socket && this.gameId) {
                    this.socket.emit('ingame_message', { gameId: this.gameId, msg: msg });
                }
            });
        });
    }

    disconnectedCallback() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

customElements.define('chat-component', ChatComponent);