import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
import{API_URL} from "../../../config.js";

export class ChatComponent extends HTMLElement{
    constructor(){
        super();
        this.socket = null;
        this.gameId = null;
        this.isMuted = false;
    }

    connectedCallback(){
        this.innerHTML = `
        <style>    
            .chatbox{
                padding : 10px;
                border : 2px double #c5a059;
                border-radius : 5px;
                background-color: rgba(20, 15, 10, 0.55);
                box-shadow: 0 0 15px #d4af37, inset 0 0 20px rgba(212, 175, 55, 0.3);
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 200px;
                color: white;
                font-family: 'Georgia', serif;
            }
            
            .chat-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                border-bottom: 1px solid #c5a059;
                padding-bottom: 5px;
                margin-bottom: 10px;
            }

            #chatIcon{
                width : 20px;
                vertical-align: middle;
            }
            
            #chatContent{
                padding: 10px;
                border-radius: 5px;
                background-color: rgba(0, 0, 0, 0.3);
                width: 90%;
                height: 120px;
                overflow-y: auto;
                font-size: 0.9rem;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .quick-chat-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-top: 10px;
                justify-content: center;
            }

            .qc-btn {
                background: linear-gradient(to bottom, #4a3721, #2a1a0a);
                color: #ffd700;
                border: 1px solid #c5a059;
                border-radius: 4px;
                font-size: 0.8rem;
                cursor: pointer;
                padding: 5px;
                transition: transform 0.1s;
            }
            .qc-btn:hover { transform: scale(1.05); }

            .mute-container {
                font-size: 0.8rem;
                color: #c5a059;
                display: flex;
                align-items: center;
                gap: 5px;
            }
        </style>
        
        <div class="chatbox">
            <div class="chat-header">
                <span><img id="chatIcon" src="assets/chat.png"> Duel Chat</span>
                <label class="mute-container">
                    <input type="checkbox" id="mute-checkbox"> Mute l'adversaire
                </label>
            </div>
            
            <div id="chatContent">
                <div style="color: #aaa; font-style: italic; text-align: center;">Que le duel commence !</div>
            </div>

            <div class="quick-chat-buttons">
                <button class="qc-btn" data-msg="Salutations !">Salutations</button>
                <button class="qc-btn" data-msg="Bien joué !">Bien joué</button>
                <button class="qc-btn" data-msg="Par la barbe de Merlin !">Oups</button>
                <button class="qc-btn" data-msg="Expecto Patronum !">Sortilège</button>
            </div>
        </div>
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

        const history = this.querySelector('#chatContent');

        this.socket.on('ingame_message_receive', (data) => {
            if (this.isMuted) return; // mute

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
            history.innerHTML = `<div style="color: #aaa; font-style: italic; text-align: center;">Que le duel commence !</div>`;
        }
    }
    setupEventListeners() {
        const history = this.querySelector('#chatContent');
        const muteCheckbox = this.querySelector('#mute-checkbox');
        const buttons = this.querySelectorAll('.qc-btn');

        muteCheckbox.addEventListener('change', (e) => {
            this.isMuted = e.target.checked;
        });

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const msg = btn.getAttribute('data-msg');

                // affichage message
                const msgDiv = document.createElement('div');
                msgDiv.innerHTML = `<span style="color:#d4af37"><b>Moi:</b></span> ${msg}`;
                history.appendChild(msgDiv);
                history.scrollTop = history.scrollHeight;

                // envoie socket
                if (this.socket && this.gameId) {
                    this.socket.emit('ingame_message', { gameId: this.gameId, msg: msg });
                }
            });
        });
    }

    disconnectedCallback() {
        if(this.socket) this.socket.disconnect();
    }
}

customElements.define('chat-component',ChatComponent);