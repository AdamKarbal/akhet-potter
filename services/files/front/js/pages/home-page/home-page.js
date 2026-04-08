import { audioService } from "../../services/AudioService.js";
import { socket } from "../../socket.js";
import { AuthService } from "../../services/AuthService.js"; // Ajout de l'importation

export class HomePage extends HTMLElement{

    constructor() {
        super();
    }

    RANK_MAPPER = {
        "1ère année" : 'assets/webp/annee1.webp',
        "2ème année" : 'assets/webp/annee2.webp',
        "3ème année" : 'assets/webp/annee3.webp',
        "4ème année" : 'assets/webp/annee4.webp',
        "5ème année" : 'assets/webp/annee5.webp',
        "6ème année" : 'assets/webp/annee6.webp',
        "7ème année" : 'assets/webp/annee7.webp'
    };

    RANK_ORDER = ["1ère année", "2ème année", "3ème année", "4ème année", "5ème année", "6ème année", "7ème année"];

    connectedCallback(){
        this.innerHTML = `
             <style>
            @font-face {
                font-family: 'HarryPotter';
                src: url('/assets/fonts/HARRYP__.TTF') format('truetype');
            }
            
            body {
                background-image: url("/assets/background1v1.png");
                background-size: 100% 100%;
                background-repeat: no-repeat;
                min-height: 100vh;
                margin: 0;
                overflow: hidden;
            }

            .home-container {
                display: grid;
                grid-template-columns: 70px 1fr;
                width: 100vw;
                height: 100vh;
            }
            
            #nav { grid-column: 1; }
            
            .main-section {
                grid-column: 2;
                display: grid;
                grid-template: 7vh 18vh 65vh 10vh / 100%;
            }  
            
            #btn-jouer-jcj, #btn-jouer-jco, #btn-jouer-local {
                background: linear-gradient(135deg, #bfb432 0%, #9c6d16 100%);
                color: #140f0a;
                border: 2px solid #ffd700;
                border-radius: 25px;
                padding: 8px 20px;
                font-family: 'Agency FB', sans-serif;
                font-weight: bold;
                font-size: 0.7em;
                text-transform: uppercase;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
                letter-spacing: 1px;
                outline: none;
                min-height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 5px;
            }

            #btn-jouer-jcj:hover, #btn-jouer-jco:hover {
                transform: scale(1.12);
                background: linear-gradient(135deg, #ffd700 0%, #c5a059 100%);
                box-shadow: 0 0 18px rgba(212, 175, 55, 0.8), 0 0 6px #ffd700;
                color: #000;
            }

            #btn-jouer-jcj:active, #btn-jouer-jco:active {
                transform: scale(0.97);
                box-shadow: 0 2px 8px rgba(212, 175, 55, 0.4);
            }

            #btn-jouer-local:disabled {
                background: #444 !important;
                border-color: #666 !important;
                color: #888 !important;
                cursor: not-allowed !important;
                transform: none !important;
                box-shadow: none !important;
            }   
            
            .user-log{
                display: flex;
                flex-direction: row;
                justify-content: flex-end;
                align-items: center;
                padding-right: 15px;
                grid-row : 1;
                grid-column: 1;
                gap: 15px;
            }
            
            .user-section {
                display: flex;
                flex-direction: row;
                justify-content: center;
                align-items: center;
                width: fit-content;
                height: 100%;
                gap : 0.75rem;
                padding-left: 0.7vw;
                padding-right: 0.7vw;
                margin-top: 2vh;
                border: 2px double #c5a059;
                border-radius: 40px;
                box-shadow: 0 0 2.5px #d4af37, inset 0 0 5px rgba(212, 175, 55, 0.3);
                font-family: 'Agency FB', sans-serif;
                font-size: 1.2em;
                color: #FFD700;
                background-color: rgba(0,0,0, 0.4);   
                cursor: pointer;
                transition: all 0.3s ease;  
            }

            #btn-logout {
                display: none; 
                width: 35px;
                height: 35px;
                margin-top: 2vh;
                border-radius: 50%;
                border: 2px solid #ff4444;
                background: rgba(255, 68, 68, 0.1);
                color: #ff4444;
                font-size: 1.2em;
                cursor: pointer;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            #btn-logout:hover {
                background: #ff4444;
                color: white;
                box-shadow: 0 0 15px #ff4444;
                transform: scale(1.1);
            }
            
            .disabled-mode {
                filter: grayscale(100%) opacity(0.6);
                pointer-events: none;
                position: relative;
            }
            
            .user-section:hover {
                transform: scale(1.05); 
                background-color: rgba(212, 175, 55, 0.15); 
                box-shadow: 0 0 15px #ffd700, inset 0 0 10px rgba(212, 175, 55, 0.5);
                text-shadow: 0 0 8px #ffd700; 
            }
            
            .connected, .disconnected {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .connected { background-color: #00ff00; box-shadow: 0 0 10px #00ff00; }
            .disconnected { background-color: #ff0000; box-shadow: 0 0 10px #ff0000; }

            .game-modes{
                display: flex;
                flex-direction: row;
                justify-content: space-evenly;
                align-items: center;
                grid-row : 3;
                grid-column: 1;
            }
            
            #local, #jcj, #jco{
                min-height: 0;
                display: flex;
                flex-direction: column;
                border: 2px double #c5a059;
                border-radius: 10px;
                box-sizing: border-box;
                box-shadow: 0 0 15px #d4af37, inset 0 0 20px rgba(212, 175, 55, 0.3);
                height: 100%;
                width: 25%;
                justify-content: flex-end;
                align-items: center;
                gap: 1.5vh;
                font-family: HarryPotter;
                font-size: 2em;
                color: #FFD700;
                background-color: rgba(0,0,0, 0.5);
                text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
                padding-bottom: 3vh;
            }
            
            #local > img, #jcj > img, #jco > img{
                max-height: 62%; 
                width: auto;
                object-fit: contain;
            }
 
            .user-rank{
                display: flex;
                flex-direction: row;
                justify-content: space-around;
                align-items: center;
                grid-row : 2;
                grid-column: 1;
                border: 2px double #c5a059;
                border-radius: 10px;
                box-sizing: border-box;
                box-shadow: 0 0 15px #d4af37, inset 0 0 20px rgba(212, 175, 55, 0.3);
                background-color: rgba(0,0,0, 0.5);
                height: 65%;
                width : 87.5%;
                align-self: center;
                justify-self: center;
            }
            
            #btn-jouer-jcj:disabled {
    background: #444 !important;
    border-color: #666 !important;
    color: #888 !important;
    cursor: not-allowed !important;
    transform: none !important;
    box-shadow: none !important;
}
            
            .progress-bg { width: 15vw; height: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid #c5a059; border-radius: 10px; overflow: hidden; }
            .progress-fill { height: 100%; background: linear-gradient(90deg, #c5a059, #ffd700); }
            .game-mode-desc { font-family: 'Agency FB', sans-serif; font-size: 0.5em; color: rgba(255, 215, 0, 0.6); font-style: italic; margin: 0; text-align: center; max-width: 90%; line-height: 1.1; }
            #pfp{ max-height: 55%; max-width: 55%; }
            
            .rank-card {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                background: rgba(255, 215, 0, 0.05);
                border-radius: 15px;
                padding: 10px 20px;
                border: 1px solid rgba(197, 160, 89, 0.2);
                transition: all 0.3s ease;
            }

            .rank-card:hover {
                background: rgba(255, 215, 0, 0.1);
                border-color: rgba(197, 160, 89, 0.5);
                box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
            }

            .info-label {
                font-family: 'HarryPotter';
                font-size: 1.8em;
                color: #FFD700;
                text-shadow: 0 0 5px rgba(212, 175, 55, 0.5);
            }

            .info-value {
                font-family: 'Agency FB';
                font-weight: bold;
                font-size: 1.4em;
                color: #fff8dc;
                letter-spacing: 1px;
            }
                
        </style>
        
        <div class="home-container">
            <navbar-component id="nav"></navbar-component>
            
            <div class="main-section">
                <div class="user-log">
                    <div class="user-section" id="user-profile">         
                        <img id="pfp" src="./../../../assets/webp/goodplayer.webp">
                        <span id="username">Se connecter</span>
                    </div>
                    <button id="btn-logout" title="Déconnexion">⏻</button>
                </div>
                <div class="user-rank"></div> 
                <div class="game-modes">
                    <div id="jco">
                        <p style="font-size: 1.2em; margin-bottom:auto;">Jouer contre Dumbledore (IA)</p>
                        <img src="./../../../assets/JCO.png">
                        <p class="game-mode-desc">Entraînez vos sorts contre un professeur qui ajustera son niveau à votre convenance.</p>
                        <button id="btn-jouer-jco">Jouer</button>
                    </div>
                    <div id="jcj">
                        <p style="font-size: 2em; margin-bottom : auto;">Jouer en ligne</p>
                        <img src="./../../../assets/JCJ.png">
                        <p class="game-mode-desc">Affrontez d'autres sorciers du monde dans des duels épiques.</p>
                        <button id="btn-jouer-jcj">Jouer</button>
                    </div>
                    <div id="local" class="disabled-mode">
                        <p style="font-size: 1.35em; margin-bottom : auto;">Jouer avec un ami en local</p>                        
                        <img src="./../../../assets/LOCAL.png">
                        <p class="game-mode-desc">Un duel à l'ancienne, sur le même grimoire.</p>
                        <button id="btn-jouer-local" disabled>Indisponible</button>
                    </div>
                </div>
                <div class="ranked-i"></div>
            </div> 
        </div>
        `;

        socket.emit("quit");
        this.querySelector(".user-section").addEventListener("click", () => {
            const token = localStorage.getItem('token');
            const username = localStorage.getItem('username');
            window.location.hash = (token && username) ? 'SUCCES' : 'LGN';
        });

        this.querySelector("#btn-logout").addEventListener("click", async () => {
            const token = localStorage.getItem('token');
            try {
                await fetch("/api/logout", {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {}
            localStorage.clear();
            this.applyDisconnectedState();
            this.querySelector(".user-rank").innerHTML = '<span class="info-label" style="opacity:0.5">Connectez-vous pour voir informations</span>';
        });

        this.querySelector("#btn-jouer-jcj").onclick = () => {
            const token = localStorage.getItem('token');
            if(!token) { window.location.hash = 'LGN'; return; }
            localStorage.setItem('matchMode', 'ranked');
            socket.emit("find-game");
        };

        this.querySelector("#btn-jouer-jco").onclick = () => { window.location.hash = 'JCO'; };

        audioService.playMainTheme();
        this.retrievePlayerInfo();
    }

    clearConnectionIndicators() {
        this.querySelector(".user-section .connected")?.remove();
        this.querySelector(".user-section .disconnected")?.remove();
    }

    applyConnectedState(username) {
        this.clearConnectionIndicators();
        const dot = document.createElement('span');
        dot.classList.add('connected');
        this.querySelector(".user-section").appendChild(dot);
        this.querySelector("#username").innerHTML = username;
        this.querySelector("#btn-logout").style.display = "flex";
        const btnJcj = this.querySelector("#btn-jouer-jcj");
        btnJcj.disabled = false;
        btnJcj.style.filter = '';
        btnJcj.style.pointerEvents = '';
    }

    applyDisconnectedState() {
        this.clearConnectionIndicators();
        const dot = document.createElement('span');
        dot.classList.add('disconnected');
        this.querySelector(".user-section").appendChild(dot);
        this.querySelector("#username").innerHTML = "Se connecter";
        this.querySelector("#btn-logout").style.display = "none";
        const btnJcj = this.querySelector("#btn-jouer-jcj");
        btnJcj.disabled = true;
        btnJcj.style.filter = 'grayscale(100%) opacity(0.5)';
        btnJcj.style.pointerEvents = 'none';
    }

    async retrievePlayerInfo(){
        const rankSection = this.querySelector(".user-rank");
        const token = await AuthService.getValidToken();
        const user = localStorage.getItem('username');

        if (!token || !user) {
            rankSection.innerHTML = '<span class="info-label" style="opacity:0.5">Connectez-vous pour voir vos exploits</span>';
            this.applyDisconnectedState();
            return;
        }

        try {
            const response = await fetch(`/api/users/search?username=${user}&t=${Date.now()}`, {
                headers : {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });

            if(response.ok) {
                const users = await response.json();
                const u = users?.[0];
                if (!u) {
                    // L'utilisateur n'existe pas dans la BDD, état incohérent
                    this.applyDisconnectedState();
                    localStorage.clear(); // Nettoie le localStorage
                    return;
                }

                const imgPath = this.RANK_MAPPER[u.rank];
                const progressPercent = ((u.elo % 1000) / 1000) * 100;
                const nextRankIndex = this.RANK_ORDER.indexOf(u.rank) + 1;
                const nextRankImg = this.RANK_ORDER[nextRankIndex] ? this.RANK_MAPPER[this.RANK_ORDER[nextRankIndex]] : imgPath;

                rankSection.innerHTML = `
                <div class="rank-card" style="width: 22%;">
                    <img style="width:30px; filter: drop-shadow(0 0 5px #ffd700);" src="assets/goodplayer.png">
                    <span class="info-value" style="color:#ffd700; text-transform: uppercase;">${u.username}</span>
                </div>

                <div class="rank-card" style="width: 22%;">
                    <img style="width:35px" src="${imgPath}">
                    <span class="info-label">${u.rank}</span>
                </div>

                <div class="rank-card" style="width: 20%;">
                    <img style="width:30px; animation: float 3s infinite ease-in-out;" src="assets/vifdor.png">
                    <span class="info-label">${u.elo}</span>
                </div>

                <div class="rank-card" style="width: 32%; flex-direction: column; gap: 5px;">
                    <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
                        <img style="width:25px; opacity: 0.7;" src="${imgPath}">
                        <div class="progress-bg">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <img style="width:25px; filter: drop-shadow(0 0 8px #ffd700);" src="${nextRankImg}">
                    </div>
                    <span style="font-family: 'Agency FB'; font-size: 0.8em; color: #c5a059;">Prochaine Année : ${Math.floor(progressPercent)}%</span>
                </div>
            `;
                this.applyConnectedState(u.username);
            } else {
                // Gère les erreurs comme 401 Unauthorized (token expiré/invalide)
                this.applyDisconnectedState();
                rankSection.innerHTML = '<span class="info-label" style="opacity:0.5">Session expirée. Reconnectez-vous.</span>';
            }
        } catch(error) {
            console.error("Erreur lors de la récupération des infos joueur:", error);
            this.applyDisconnectedState();
            rankSection.innerHTML = '<span class="info-label" style="opacity:0.5">Erreur de connexion au serveur.</span>';
        }
    }
}

customElements.define('home-page', HomePage);