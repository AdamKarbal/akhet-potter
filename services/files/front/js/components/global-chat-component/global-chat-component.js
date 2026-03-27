import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
import {API_URL} from "../../../config.js";

export class GlobalChatComponent extends HTMLElement {
    constructor() {
        super();
        this.socket=null;
    }

    connectedCallback() {
        this.innerHTML = `
        <style>    
            * {
                box-sizing: border-box;
            }
            
            .chat-modal {
                display: none;
                position: fixed;
                bottom: 20px;
                left: 85px; 
                width: 300px;
                height: 400px;
                background-color: rgba(20, 15, 10, 0.95);
                border: 2px double #c5a059;
                border-radius: 10px;
                box-shadow: 0 0 15px #d4af37, inset 0 0 20px rgba(212, 175, 55, 0.3);
                z-index: 1000;
                flex-direction: column;
                font-family: 'Georgia', serif;
                color: #e0d2b4;
            }

            .chat-header {
                padding: 10px;
                border-bottom: 1px solid #c5a059;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background-color: rgba(0,0,0,0.5);
                border-radius: 10px 10px 0 0;
            }

            .close-btn {
                color: #c5a059;
                cursor: pointer;
                font-weight: bold;
                font-size: 1.2rem;
            }

            .chat-history {
                flex-grow: 1;
                padding: 10px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 8px;
                font-size: 0.9rem;
            }

            .msg { padding: 5px 8px; border-radius: 5px; background: rgba(200,200,200,0.1); width: fit-content; max-width: 90%; }
            .msg.me { background: rgba(212, 175, 55, 0.2); align-self: flex-end; border: 1px solid #c5a059; }

            .chat-input-area {
                display: flex;
                padding: 10px;
                border-top: 1px solid #c5a059;
            }

            .chat-input-area input {
                flex-grow: 1;
                background: #3a2a1a;
                border: 1px solid #c5a059;
                color: white;
                padding: 8px;
                border-radius: 4px;
                outline: none;
            }

            .chat-input-area button {
                background: linear-gradient(to bottom, #4a3721, #2a1a0a);
                color: #ffd700;
                border: 1px solid #c5a059;
                cursor: pointer;
                margin-left: 5px;
                border-radius: 4px;
            }
        </style>
        
        <div id="global-chat-window" class="chat-modal">
            <div class="chat-header">
                <span><img src="assets/globalchat.png" style="width: 20px; vertical-align: middle;"> Grande Salle (Global)</span>
                <span class="close-btn" id="close-global-chat">&times;</span>
            </div>
            <div class="chat-history" id="global-history">
                <div class="msg"><b>Serveur:</b> Bienvenue dans le chat global !</div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="global-input" placeholder="Envoyer un hibou..." autocomplete="off">
                <button id="global-send">Envoyer</button>
            </div>
        </div>
        `;
        this.initSocket();
        this.setupEventListeners();
    }
    initSocket() {
        const token = localStorage.getItem("token");
        if (!token) return; // Si pas co, pas de chat

        // Connexion au SocialService
        this.socket = io(API_URL, {
            path: "/social.io",
            transports: ["websocket"],
            auth: { token: token }
        });

        const history = this.querySelector('#global-history');

        // Réception d'un message
        this.socket.on('global_message_receive', (data) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'msg';
            // On affiche le pseudo de l'expéditeur
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

        closeBtn.onclick = () => this.toggle(false);

        const sendMessage = () => {
            const text = input.value.trim();
            if (text !== "" && this.socket) {
                // affichage
                const msgDiv = document.createElement('div');
                msgDiv.className = 'msg me';
                msgDiv.innerHTML = `<b>Moi:</b> ${text}`;
                history.appendChild(msgDiv);
                history.scrollTop = history.scrollHeight;

                // envoie au serveur
                this.socket.emit('global_message', text);

                input.value = "";
            }
        };

        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
    }

    // Méthode appelée par la Navbar
    toggle(forceState = null) {
        const modal = this.querySelector('#global-chat-window');
        if (forceState !== null) {
            modal.style.display = forceState ? 'flex' : 'none';
        } else {
            modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
        }
    }

    disconnectedCallback() {
        if(this.socket) this.socket.disconnect();
    }
}
customElements.define('global-chat', GlobalChatComponent);