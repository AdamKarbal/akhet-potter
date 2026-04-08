import { audioService } from "../../services/AudioService.js";
import { socket } from "../../socket.js";

export class HomePage extends HTMLElement{

    constructor() {
        super();
    }

    RANK_MAPPER = {
        "1ère année" : 'assets/annee1.png',
        "2ème année" : 'assets/annee2.png',
        "3ème année" : 'assets/annee3.png',
        "4ème année" : 'assets/annee4.png',
        "5ème année" : 'assets/annee5.png',
        "6ème année" : 'assets/annee6.png',
        "7ème année" : 'assets/annee7.png'
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
            }

            .home-container {
                display: grid;
                grid-template-columns: 5% 95%;
                width: 100vw;
                height: 100vh;
            }
            
            #nav { grid-column: 1; }
            
            .main-section {
                grid-column: 2;
                display: grid;
                grid-template: 7vh 18vh 65vh 10vh / 100%;
            }     
            
            .user-log{
                display: flex;
                flex-direction: row;
                justify-content: flex-end;
                align-items: center;
                padding-right: 15px;
                grid-row : 1;
                grid-column: 1;
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
            
            .user-section:hover {
                transform: scale(1.05); 
                background-color: rgba(212, 175, 55, 0.15); 
                box-shadow: 0 0 15px #ffd700, inset 0 0 10px rgba(212, 175, 55, 0.5);
                text-shadow: 0 0 8px #ffd700; 
            }
            
            .connected {
                width: 10px;
                height: 10px;
                background-color: #00ff00; 
                border-radius: 50%;
                flex-shrink: 0;
                
                box-shadow: 
                    0 0 4px #00ff00,  
                    0 0 10px #00ff00, 
                    0 0 18px rgba(0, 255, 0, 0.5);
                    
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .disconnected {
                width: 10px;
                height: 10px;
                background-color: #ff0000; 
                border-radius: 50%;
                flex-shrink: 0;
                
                box-shadow: 
                    0 0 4px #ff0000,  
                    0 0 10px #ff0000, 
                    0 0 18px rgba(197,0,0,0.5); 
                    
                border: 1px solid rgba(255, 255, 255, 0.3);
            }

            .game-modes{
                display: flex;
                flex-direction: row;
                justify-content: space-evenly;
                align-items: center;
                grid-row : 3;
                grid-column: 1;
            }
            
            .ranked-i{
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                grid-row : 4;
                grid-column: 1;
            }
            
            #pfp{
                max-height: 55%;
                max-width: 55%;
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
 
            #btn-jouer-jcj,  #btn-jouer-jco, #btn-jouer-local{
                background: linear-gradient(135deg, #bfb432 0%, #9c6d16 100%);
                color: #140f0a;
                border: 2px solid #ffd700;
                border-radius: 25px;
                padding: 8px 24px;
                font-family: 'Agency FB', sans-serif; /* Plus lisible que HarryPotter pour un bouton */
                font-weight: bold;
                font-size: 0.6em; /* Ajusté car le parent est à 2em */
                text-transform: uppercase;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
                letter-spacing: 1px;
            }

            #btn-jouer-jcj:hover ,  #btn-jouer-jco:hover , #btn-jouer-local:hover{
                transform: scale(1.05);
                background: linear-gradient(135deg, #ffd700 0%, #c5a059 100%);
                box-shadow: 0 0 15px #ffd700;
                color: #000;
            }

            #btn-jouer-jcj:active,  #btn-jouer-jco:active, #btn-jouer-local:active{
                transform: scale(0.95);
                box-shadow: 0 0 5px #ffd700;
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
                padding: ;
            }
            
            .rank, .username, .prog{
                font-family: 'Agency FB',serif;
                font-size: 1.2em;
                color: #FFD700;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                gap : 3%;
                width: 20%;
            }  
            
            .elo {
                font-family: HarryPotter;
                font-size: 1.5em;
                color: #FFD700;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                gap : 3%;
                width: 20%;
            }
            
            .prog{
                width: 35%;
            }
            
            .progress-bg {
                width: 15vw; 
                height: 10px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #c5a059;
                border-radius: 10px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #c5a059, #ffd700);
                box-shadow: 0 0 10px #ffd700;
            }
            
            .game-mode-desc {
                font-family: 'Agency FB', sans-serif;
                font-size: 0.5em; 
                color: rgba(255, 215, 0, 0.6); /* Doré semi-transparent pour rester discret */
                font-style: italic;
                margin: 0;
                text-align: center;
                max-width: 90%;
                line-height: 1.1;
            }
                
        </style>
        
        <div class="home-container">
            <navbar-component id="nav"></navbar-component>
            
            <div class="main-section">
                <div class="user-log">
                    <div class="user-section">         
                        <img id="pfp" src="./../../../assets/goodplayer.png">
                        <span id="username" >Se connecter<span>
                    </div>
                </div>
                <div class="user-rank">
                </div> 
                <div class="game-modes">
                    <div id="jco">
                        <p style="font-size: 1.2em; margin-bottom:auto;">Jouer contre Dumbeldore (IA)</p>
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
                    <div id="local">
                        <p style="font-size: 1.35em; margin-bottom : auto;">Jouer avec un ami en local</p>                        
                        <img src="./../../../assets/LOCAL.png">
                        <p class="game-mode-desc">Un duel à l'ancienne, sur le même grimoire.</p>
                        <button id="btn-jouer-local">Jouer</button>
                    </div>
                </div>
                <div class="ranked-i"> Ici les infos de la ranked à remplir </div>
            </div> 
        </div>
        `


        this.querySelector(".user-section").addEventListener("click", (e) => {
            window.location.hash = 'LGN';
        });

        this.querySelector("#btn-jouer-jcj").onclick = () => {
            window.location.hash = "LGN";
        };

        this.querySelector("#btn-jouer-jco").addEventListener("click", () => {
            window.location.hash = 'JCO';
        });

        this.querySelector("#btn-jouer-local").addEventListener("click", () => {
            window.location.hash = 'JCO'; //TODO:A changer par la vraie page locl
        });

        audioService.playMainTheme();
        this.retrievePlayerInfo();

        /*window.addEventListener("click" , () => {
            audioService.playMainTheme();
        })*/
    }

    clearConnectionIndicators() {
        this.querySelector(".user-section .connected")?.remove();
        this.querySelector(".user-section .disconnected")?.remove();
    }

    applyConnectedState(username) {
        this.clearConnectionIndicators();
        const isConnected = document.createElement('span');
        isConnected.classList.add('connected');
        this.querySelector(".user-section").appendChild(isConnected);
        this.querySelector("#username").innerHTML = username;
        this.querySelector("#btn-jouer-jcj").innerHTML = "Jouer";
        this.querySelector("#btn-jouer-jcj").onclick = () => {
            localStorage.setItem('matchMode', 'ranked');
            socket.emit("find-game");
        };
    }

    applyDisconnectedState() {
        this.clearConnectionIndicators();
        const isDisconnected = document.createElement('span');
        isDisconnected.classList.add('disconnected');
        this.querySelector(".user-section").appendChild(isDisconnected);
        this.querySelector("#username").innerHTML = "Se connecter";
        this.querySelector("#btn-jouer-jcj").innerHTML = "Se connecter";
        this.querySelector("#btn-jouer-jcj").onclick = () => {
            window.location.hash = "LGN";
        };
    }

    async retrievePlayerInfo(){
        const token = localStorage.getItem('token');
        const rankSection = this.querySelector(".user-rank");

        if (!token) {
            rankSection.innerHTML = '';
            this.applyDisconnectedState();
            return;
        }

        try{
            const response = await fetch(`/api/users/search?username=${localStorage.getItem('username')}`, {
                method: 'GET',
                headers : {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const username = document.createElement('div');
            const rank = document.createElement('div');
            const elo = document.createElement('div');
            const prog = document.createElement('div');

            if(response.ok){
                const users = await response.json();
                const user = users?.[0];
                if (!user) {
                    rankSection.innerHTML = '';
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    this.applyDisconnectedState();
                    return;
                }
                const imgPath = this.RANK_MAPPER[user.rank];
                const progressPercent = ((user.elo % 1000)/1000) * 100;
                const nextRankImg = this.RANK_MAPPER[this.RANK_ORDER[this.RANK_ORDER.indexOf(user.rank) + 1]];

                rankSection.innerHTML = '';

                username.innerHTML = `
                    <img style="width:20%" src="assets/goodplayer.png">
                    <span class="username">${user.username}</span>`;
                username.classList.add('username');
                username.style.display = 'flex';
                username.style.flexDirection = 'row';
                username.style.alignItems = 'center';
                username.style.justifyContent = 'center';
                username.style.gap = '15px';
                rankSection.appendChild(username);

                rank.innerHTML = `
                    <img style="width:20%" src="${imgPath}">
                    <span class="rank">${user.rank}</span>`;
                rank.classList.add('rank');
                rankSection.appendChild(rank);

                elo.innerHTML = `
                    <img style="width:25%" src="assets/vifdor.png">
                    <span class="elo">${user.elo}</span>`;
                elo.classList.add('elo');
                rankSection.appendChild(elo);

                prog.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img style="width:10%" src="${imgPath}">
                        <div class="progress-bg">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <img style="width:10%" src="${nextRankImg}">
                    </div>
                    `;
                prog.classList.add('prog');
                rankSection.appendChild(prog);

                this.applyConnectedState(user.username);
            }
            else{
                const refresh = await fetch("/api/refresh" , {
                    method : 'POST',
                    credentials: 'include'
                });

                if(refresh.ok){
                    const data = await refresh.json();
                    if (data?.accessToken) {
                        localStorage.setItem('token', data.accessToken);
                        await this.retrievePlayerInfo();
                        return;
                    }
                }

                rankSection.innerHTML = '';
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                this.applyDisconnectedState();
            }
        }
        catch(error){
            rankSection.innerHTML = '';
            this.applyDisconnectedState();
            console.log("Erreur lors de récup des infos du joueur : ", error);
        }
    }
}

customElements.define('home-page', HomePage);