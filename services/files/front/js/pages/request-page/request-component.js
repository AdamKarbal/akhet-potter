import { PlayerRank } from "../../components/rank/userRank.js";
import { NavbarComponent } from "../../components/navbar-component/navbar-component.js";
import {RequestService} from "../../services/RequestService.js";
import {AuthService} from "../../services/AuthService.js";

export class RequestComponent extends HTMLElement {
    constructor() {
        super();
        this.debounceTimer = null;
    }

    connectedCallback() {
        this.innerHTML = `
        <style>
            @font-face {
                font-family: 'HarryPotter';
                src: url('/assets/fonts/HARRYP__.TTF') format('truetype');
            }
            
            #reqTitle{
                margin-top: 2.5vh;
                font-family: HarryPotter;
                font-size: 3em;
                background: linear-gradient(to bottom, #FFF8DC 0%, #FFD700 50%, #8B4513 100%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
                margin-bottom: 0.5rem;
            }
            
            body {
                background-image: url("/assets/background1v1.webp");
                background-size: 100% 100%;
                background-repeat: no-repeat;
                min-height: 100vh;
                margin: 0;
            }
            
            #nav {
             grid-column: 1; 
            }
  
            .search-item {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                background: rgba(20, 15, 10, 0.5);
                border: 1px solid rgba(197, 160, 89, 0.3);
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 8px;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
            }
            
            .container{
                display: grid;
                grid-template : 100% / 10% 90%;
            }
            
            .username{
                font-family: "Agency FB";
                font-size: 1.5em;
                background: linear-gradient(to bottom, #FFF8DC 0%, #FFD700 50%, #8B4513 100%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
            }
            
            #requestSection{
                grid-column: 2;
                width: 90%;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .accept-btn, .deny-btn{
            margin-left: 1vw;
                background: rgba(40, 30, 20, 0.6);
                border: 1px solid #c5a059;
                color: #c5a059;
                font-family: 'Agency FB', sans-serif;
                cursor: pointer;
                border-radius: 5px;
                padding: 6px 12px;
                transition: all 0.2s;
            }
            
            .accept-btn:hover, .deny-btn:hover {
                background: #c5a059;
                color: #140f0a;
                box-shadow: 0 0 12px #d4af37;
                transform: scale(1.05);
            }
            
            .accept-btn:disabled, .deny-btn:disabled {
                border-color: #666;
                color: #666;
                cursor: default;
                box-shadow: none;
                transform: none;
            }
  
        </style>
        
        <div class="container">
            <navbar-component id="nav"></navbar-component>
            
            <div id="requestSection">
                <span id="reqTitle">Demandes d'ami</span>
                <div id="reqList"></div>
            </div>
        </div>
        `;
        console.log("Composant RequestComponent injecté dans le DOM");
        this.fetchMyRequests();
        window.addEventListener('friendrequests-changed', () => {
            this.fetchMyRequests();
        });
    }

    async fetchMyRequests() {
        const token = await AuthService.getValidToken();
        console.log("token : ", token);
        try {
            const response = await fetch(`/api/requests`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const requests = await response.json();
                console.log(requests);
                this.displayRequests(requests);
            }
        } catch (error) {
            console.error("Erreur de recherche :", error);
        }
    }

    displayRequests(requests) {
        const list = this.querySelector('#reqList');

        if (requests.length === 0) {
            list.innerHTML = `
                <style>
                    .emptyMsg {
                        margin-top: 50%;
                        font-family: "Agency FB", serif;
                        font-size: 2em;
                        background: linear-gradient(to bottom, #FFF8DC 0%, #FFD700 50%, #8B4513 100%);
                        -webkit-background-clip: text;
                        background-clip: text;
                        color: transparent;
                        filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
                        animation: float 3s ease-in-out infinite;
                    }
        
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                </style>
                <div class="emptyMsg">Pas de demande d'amis... (Pour l'instant !)</div>`;
            return;
        }

        requests.forEach(user => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `
                <span class="username">${user.username}</span>
                <span class="rank" style="margin-left: 1vw;"><player-rank></player-rank></span>
                <button class="accept-btn">Accepter</button>
                <button class="deny-btn">Refuser</button>
            `;
            list.appendChild(div);

            const rankComp = div.querySelector('player-rank');
            if (rankComp) rankComp.setPlayerInfo(user);

            div.querySelector('.accept-btn').addEventListener('click', async (e) => {
                const success = await RequestService.handleDecision(user.username, "accept");
                if (success) {
                    e.target.innerText = "Accepté !";
                    e.target.disabled = true;
                    div.querySelector('.deny-btn').style.display = 'none';
                    setTimeout(() => div.remove(), 1000);
                }
            });

            div.querySelector('.deny-btn').addEventListener('click', async () => {
                const success = await RequestService.handleDecision(user.username, "deny");
                if (success) div.remove();
            });
        });
    }
}
customElements.define('request-component', RequestComponent);