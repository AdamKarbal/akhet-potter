import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
import { API_URL } from "../../../config.js";

export class GlobalChatComponent extends HTMLElement {
    constructor() {
        super();
        this.socket = null;
    }

    async connectedCallback() {
        const htmlUrl = new URL('./global-chat-component.html', import.meta.url);
        const cssUrl = new URL('./global-chat-component.css', import.meta.url);

        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;

        this.initSocket();
        this.setupEventListeners();

        if (window.visualViewport) {
            this._onViewportResize = () => this.adjustForKeyboard();
            window.visualViewport.addEventListener('resize', this._onViewportResize);
        }
    }

    initSocket() {
        const token = localStorage.getItem("token");
        if (!token) return;

        this.socket = io(API_URL, {
            path: "/social.io",
            transports: ["websocket"],
            auth: { token: token }
        });

        this.socket.on('global_message_receive', (data) => {
            const history = this.querySelector('#global-history');
            if (!history) return;

            const msgDiv = document.createElement('div');
            msgDiv.className = 'msg';
            msgDiv.innerHTML = `<b style="color:#d4af37">${data.sender}:</b> ${data.message}`;
            history.appendChild(msgDiv);
            history.scrollTop = history.scrollHeight;
        });
    }

    setupEventListeners() {
        const closeBtn = this.querySelector('#close-global-chat');
        const sendBtn = this.querySelector('#global-send');
        const input = this.querySelector('#global-input');
        const history = this.querySelector('#global-history');

        if (closeBtn) {
            closeBtn.onclick = () => this.toggle(false);
        }

        const sendMessage = () => {
            if (!input || !history) return;

            const text = input.value.trim();
            if (text !== "" && this.socket) {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'msg me';
                msgDiv.innerHTML = `<b>Moi:</b> ${text}`;
                history.appendChild(msgDiv);
                history.scrollTop = history.scrollHeight;

                this.socket.emit('global_message', text);
                input.value = "";
            }
        };

        if (sendBtn) sendBtn.onclick = sendMessage;
        if (input) input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
    }

    toggle(forceState = null) {
        const modal = this.querySelector('#global-chat-window');
        if (!modal) return;

        if (forceState !== null) {
            modal.style.display = forceState ? 'flex' : 'none';
        } else {
            modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
        }
    }

    disconnectedCallback() {
        if(this.socket) {
            this.socket.disconnect();
        }
        if (window.visualViewport && this._onViewportResize) {
            window.visualViewport.removeEventListener('resize', this._onViewportResize);
        }
    }

    adjustForKeyboard() {
        const isMobile = document.body.classList.contains('is-android');
        if (!isMobile) return;

        const chatWindow = this.querySelector('#global-chat-window');
        if (!chatWindow || chatWindow.style.display === 'none') return;

        chatWindow.style.height = `${window.visualViewport.height}px`;

        const history = chatWindow.querySelector('.chat-history');
        if (history) history.scrollTop = history.scrollHeight;
    }
}

customElements.define('global-chat', GlobalChatComponent);