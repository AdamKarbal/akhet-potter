import { PlayerRank } from "../rank/userRank.js";
import { NavbarComponent } from "../navbar-component/navbar-component.js";

export class SOCIALComponent extends HTMLElement {
    constructor() {
        super();
        this.debounceTimer = null;
        this.friendList = [];
    }

    connectedCallback() {
        this.innerHTML = `
        <style>
            @font-face {
                font-family: 'HarryPotter';
                src: url('assets/fonts/HARRYP__.TTF') format('truetype');
            }
            
            body {
                background-image: url("assets/background1v1.png");
                background-size: 100% 100%;
                background-repeat: no-repeat;
                min-height: 100vh;
                margin: 0;
            }

            .soc-container {
                display: grid;
                grid-template-columns: 10% 45% 45%;
                width: 100vw;
                height: 100vh;
            }
            
            #nav { grid-column: 1; }
            
            #friendsSection {
                grid-column: 2;
                display: flex;
                flex-direction: column;
                padding: 2rem;
                gap: 1.5rem;
                align-items: center;
            }
            
            #searchSection {
                grid-column: 3;
                display: flex;
                flex-direction: column;
                padding: 2rem;
                gap: 1.5rem;
            }

            /* Titres avec dégradé doré et lueur magique */
            #friendTitle, .searchbar-label {
                font-family: HarryPotter;
                font-size: 2em;
                background: linear-gradient(to bottom, #FFF8DC 0%, #FFD700 50%, #8B4513 100%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
                margin-bottom: 0.5rem;
            }

            /* Champ de recherche stylisé */
            .searchbar-container {
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
            }
            
            .searchbar-container > input {
                background-color: rgba(20, 15, 10, 0.7);
                border: 2px double #c5a059;
                border-radius: 8px;
                padding: 12px 18px;
                color: #fff8dc;
                font-family: 'Agency FB', sans-serif;
                font-size: 1.1em;
                outline: none;
                box-shadow: 0 0 10px rgba(212, 175, 55, 0.2), inset 0 0 10px rgba(0, 0, 0, 0.5);
                transition: all 0.3s ease;
                width: 85%;
            }
            
            .searchbar-container > input:focus {
                border-color: #d4af37;
                box-shadow: 0 0 20px rgba(212, 175, 55, 0.5), inset 0 0 10px rgba(212, 175, 55, 0.1);
                background-color: rgba(30, 25, 15, 0.8);
            }
            
            .searchbar-container > input::placeholder {
                color: rgba(197, 160, 89, 0.4);
                font-style: italic;
            }

            .search-item {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                background: rgba(20, 15, 10, 0.5);
                border: 1px solid rgba(197, 160, 89, 0.3);
                padding-left: 10px;
                padding-right: 10px;
                padding-top: 5px;
                padding-bottom: 5px;
                border-radius: 8px;
                margin-bottom: 8px;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                width: fit-content;
                gap: 1.5rem;
            }

            .username {
                font-family: "Agency FB";
                font-size: 1.4em;
                background: linear-gradient(to bottom, #FFF8DC 0%, #FFD700 50%, #8B4513 100%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.4));
            }

            .add-btn {
                background: rgba(40, 30, 20, 0.6);
                border: 1px solid #c5a059;
                color: #c5a059;
                font-family: 'Agency FB', sans-serif;
                cursor: pointer;
                border-radius: 5px;
                padding: 6px 12px;
                transition: all 0.2s;
            }

            .add-btn:hover {
                background: #c5a059;
                color: #140f0a;
                box-shadow: 0 0 12px #d4af37;
                transform: scale(1.05);
            }
            
            .add-btn:disabled {
                border-color: #666;
                color: #666;
                cursor: default;
                box-shadow: none;
                transform: none;
            }

            #searchResults {
                margin-top: 1rem;
                max-height: 70vh;
                overflow-y: auto;
            }
            
            .hidden { display: none; }
            
            .friend-item{
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                background: rgba(20, 15, 10, 0.5);
                border: 1px solid rgba(197, 160, 89, 0.3);
                padding-left: 10px;
                padding-right: 10px;
                padding-top: 5px;
                padding-bottom: 5px;
                border-radius: 8px;
                margin-bottom: 8px;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                gap: 1.5rem;
            }
            
            .remove-btn{
                background: rgba(40, 30, 20, 0.6);
                border: 1px solid #c5a059;
                color: #c5a059;
                font-family: 'Agency FB', sans-serif;
                cursor: pointer;
                border-radius: 5px;
                padding: 6px 12px;
                transition: all 0.2s;
            }
            
            .remove-btn:hover {
                background: #c5a059;
                color: #140f0a;
                box-shadow: 0 0 12px #d4af37;
                transform: scale(1.05);
            }
            
            .remove-btn:disabled {
                border-color: #666;
                color: #666;
                cursor: default;
                box-shadow: none;
                transform: none;
            }

        </style>
        
        <div class="soc-container">
            <navbar-component id="nav"></navbar-component>
            
            <div id="friendsSection">
                <span id="friendTitle">Amis</span>
                <div id="friendList"></div>
            </div>
            
            <div id="searchSection">
                <div class="searchbar-container">
                    <span class="searchbar-label">Rechercher un sorcier :</span>
                    <input type="text" id="input" placeholder="Ex: HarryDu06">
                </div>
                <div id="searchResults"></div>
            </div>
        </div>
        `;

        const input = this.querySelector('#input');
        input.addEventListener('input', () => this.handleInput(input.value));

        this.getFriendList();
    }

    handleInput(value) {
        clearTimeout(this.debounceTimer);
        const query = value.trim();

        if (query.length < 2) {
            this.querySelector('#searchResults').innerHTML = '';
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.executeSearch(query);
        }, 300);
    }

    async executeSearch(query) {
        try {
            const response = await fetch(`/api/users/search?username=${encodeURIComponent(query)}`);
            if (response.ok) {
                const users = await response.json();
                this.displayResults(users);
            }
        } catch (error) {
            console.error("Erreur de recherche :", error);
        }
    }

    displayResults(users) {
        const container = this.querySelector('#searchResults');
        container.innerHTML = '';

        if (users.length < 1) {
            container.innerHTML = '<div class="username" style="font-size: 1em;">Aucun sorcier trouvé...</div>';
            return;
        }

        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'search-item';
            const isAlreadyFriend = this.friendList.some(f => f.username === user.username);
            if(isAlreadyFriend) {
                div.innerHTML = `
                <span class="username">${user.username}</span>
                <span class="rank"><player-rank></player-rank></span>
            `;
            } else{
                div.innerHTML = `
                <span class="username">${user.username}</span>
                <span class="rank"><player-rank></player-rank></span>
                <button class="add-btn">+ Ajouter</button>
                `;
                div.querySelector('.add-btn').addEventListener('click', (e) => {
                    this.sendFriendRequest(user.username, e.target);
                });
            }
            container.appendChild(div);

            const rankComp = div.querySelector('player-rank');
            if (rankComp) rankComp.setPlayerInfo(user);
        });
    }

    async sendFriendRequest(targetUser, button) {
        button.disabled = true;
        button.innerText = "Sortilège...";
        try {
            const fromUser = localStorage.getItem('token');
            const response = await fetch(`/api/sendreq`, {
                method: 'POST',
                body: JSON.stringify({ to: targetUser }),
                headers: {
                    'Authorization': `Bearer ${fromUser}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = response.json();

            if(response.ok){
                button.innerText = "Envoyé !";
            } else {
                button.disabled = false;
                button.innerText = "Ajouter";
            }
        } catch (error) {
            console.error("Erreur d'envoi de demande :", error);
        }
    }

    async getFriendList(){
        try{
            const token = localStorage.getItem('token');
            const response = await fetch('/api/friends', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const friends = await response.json();
                this.friendList = friends;
                console.log("Liste d'amis : ", this.friendList);
                const friendList = this.querySelector('#friendList')
                friendList.innerHTML = '';
                friends.forEach(friend => {
                    const div = document.createElement('div');
                    div.className = 'friend-item';
                    div.innerHTML = `
                        <span class="username">${friend.username}</span>
                        <span class="rank"><player-rank></player-rank></span>
                        <button class="remove-btn">Retirer</button>
                    `;
                    friendList.appendChild(div);

                    const rankComp = div.querySelector('player-rank');
                    if (rankComp) rankComp.setPlayerInfo(friend);
                });
            }
        }
        catch (error) {
            console.error("Erreur de recherche de la liste d'amis :", error);
        }
    }
}

customElements.define('social-component', SOCIALComponent);