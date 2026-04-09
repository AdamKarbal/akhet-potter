import { socket } from "../../socket.js";
import { RequestService} from "../../services/RequestService.js";
import {AuthService} from "../../services/AuthService.js";

export class SOCIALComponent extends HTMLElement {
    constructor() {
        super();
        this.debounceTimer = null;
        this.friendList = [];
    }

    async connectedCallback() {
      const htmlUrl = new URL('./social-component.html', import.meta.url);
      const cssUrl = new URL('./social-component.css', import.meta.url);
      const response = await fetch(htmlUrl);
      const html = await response.text();

      this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;
      // FIXME: update html
      //
      // <style>
      //     @font-face {
      //         font-family: 'HarryPotter';
      //         src: url('assets/fonts/HARRYP__.TTF') format('truetype');
      //     }
      //
      //     body {
      //         background-image: url("assets/background1v1.png");
      //         background-size: 100% 100%;
      //         background-repeat: no-repeat;
      //         min-height: 100vh;
      //         margin: 0;
      //     }
      //
      //     .soc-container {
      //         display: grid;
      //         grid-template-columns: 10% 45% 45%;
      //         grid-template-rows: 17% 83%;
      //         width: 100vw;
      //         height: 100vh;
      //     }
      //
      //     #nav {
      //         grid-column: 1;
      //         grid-row: 1/3;
      //     }
      //
      //     #friendsSection {
      //         grid-column: 2;
      //         display: flex;
      //         flex-direction: column;
      //         padding: 2rem;
      //         gap: 1.5rem;
      //         align-items: center;
      //         grid-row: 2;
      //     }
      //
      //     #searchSection {
      //         grid-column: 3;
      //         display: flex;
      //         flex-direction: column;
      //         padding: 2rem;
      //         gap: 1.5rem;
      //         grid-row: 2;
      //     }

      // #friendTitle, .searchbar-label {
      //     font-family: HarryPotter;
      //     font-size: 2.9em;
      //     background: linear-gradient(to bottom, #FFF8DC 0%, #FFD700 50%, #8B4513 100%);
      //     -webkit-background-clip: text;
      //     background-clip: text;
      //     color: transparent;
      //     filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
      //     margin-bottom: 0.5rem;
      // }

      //     .searchbar-container {
      //         display: flex;
      //         flex-direction: column;
      //         gap: 0.8rem;
      //     }
      //
      //     .searchbar-container > input {
      //         background-color: rgba(20, 15, 10, 0.7);
      //         border: 2px double #c5a059;
      //         border-radius: 8px;
      //         padding: 12px 18px;
      //         color: #fff8dc;
      //         font-family: 'Agency FB', sans-serif;
      //         font-size: 1.1em;
      //         outline: none;
      //         box-shadow: 0 0 10px rgba(212, 175, 55, 0.2), inset 0 0 10px rgba(0, 0, 0, 0.5);
      //         transition: all 0.3s ease;
      //         width: 85%;
      //     }
      //
      //     .searchbar-container > input:focus {
      //         border-color: #d4af37;
      //         box-shadow: 0 0 20px rgba(212, 175, 55, 0.5), inset 0 0 10px rgba(212, 175, 55, 0.1);
      //         background-color: rgba(30, 25, 15, 0.8);
      //     }
      //
      //     #logo{
      //         height: 20vh;
      //         justify-self: center;
      //         grid-column: 1/4;
      //         grid-row: 1;
      //         margin-top: 1vh;
      //     }
      //
      //     .searchbar-container > input::placeholder {
      //         color: rgba(197, 160, 89, 0.4);
      //         font-style: italic;
      //     }
      //
      //     .username {
      //         font-family: "Agency FB";
      //         font-size: 1.4em;
      //         background: linear-gradient(to bottom, #FFF8DC 0%, #FFD700 50%, #8B4513 100%);
      //         -webkit-background-clip: text;
      //         background-clip: text;
      //         color: transparent;
      //         filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.4));
      //     }
      //
      //     .add-btn {
      //         background: rgba(40, 30, 20, 0.6);
      //         border: 1px solid #c5a059;
      //         color: #c5a059;
      //         font-family: 'Agency FB', sans-serif;
      //         cursor: pointer;
      //         border-radius: 5px;
      //         padding: 6px 12px;
      //         transition: all 0.2s;
      //     }
      //
      //     .add-btn:hover {
      //         background: #c5a059;
      //         color: #140f0a;
      //         box-shadow: 0 0 12px #d4af37;
      //         transform: scale(1.05);
      //     }
      //
      //     .add-btn:disabled {
      //         border-color: #666;
      //         color: #666;
      //         cursor: default;
      //         box-shadow: none;
      //         transform: none;
      //     }
      //
      //     #searchResults {
      //         margin-top: 1rem;
      //         max-height: 70vh;
      //         overflow-y: auto;
      //     }
      //
      //     .hidden { display: none; }
      //
      //     .friend-item{
      //         display: flex;
      //         flex-direction: row;
      //         justify-content: space-between;
      //         align-items: center;
      //         background: rgba(20, 15, 10, 0.7);
      //         border: 2px outset rgba(197, 160, 89, 0.7);
      //         padding : 2vh 1vw;
      //         border-radius: 8px;
      //         margin-bottom: 8px;
      //         box-shadow: 0 0 10px rgba(0,0,0,0.5);
      //         gap: 1.5rem;
      //     }
      //
      //     .search-item {
      //         display: flex;
      //         flex-direction: row;
      //         justify-content: space-between;
      //         align-items: center;
      //         background: rgba(20, 15, 10, 0.5);
      //         border: 0 solid rgba(197, 160, 89, 0.3);
      //         padding : 2vh 1vw;
      //         border-radius: 12px;
      //         margin-bottom: 8px;
      //         width: fit-content;
      //         gap: 1.5rem;
      //     }
      //
      //     .remove-btn, #friendlyBtn{
      //         font-size: 1em;
      //         background: rgba(40, 30, 20, 0.6);
      //         border: 1px outset #c5a059;
      //         color: #c5a059;
      //         font-family: 'Agency FB', sans-serif;
      //         cursor: pointer;
      //         border-radius: 5px;
      //         padding: 6px 12px;
      //         transition: all 0.2s;
      //     }
      //
      //     .remove-btn:hover, #friendlyBtn:hover {
      //         background: #c5a059;
      //         color: #140f0a;
      //         box-shadow: 0 0 12px #d4af37;
      //         transform: scale(1.05);
      //     }
      //
      //     .remove-btn:disabled, #friendlyBtn:disabled{
      //         border-color: #666;
      //         color: #666;
      //         cursor: default;
      //         box-shadow: none;
      //         transform: none;
      //     }
      //
      // </style>
      //
      // <div class="soc-container">
      //     <navbar-component id="nav"></navbar-component>
      //     <img id="logo" src="../../../assets/social.png">
      //     <div id="friendsSection">
      //         <span id="friendTitle">Amis</span>
      //         <div id="friendList"></div>
      //     </div>
      //
      //     <div id="searchSection">
      //         <div class="searchbar-container">
      //             <span class="searchbar-label">Rechercher un sorcier :</span>
      //             <input type="text" id="input" placeholder="Ex: HarryDu06">
      //         </div>
      //         <div id="searchResults"></div>
      //     </div>
      // </div>
      // `;

      this.initComponent();
    }

  initComponent() {
    const input = this.querySelector('#input');
    if (input) {
            input.addEventListener('input', () => this.handleInput(input.value));
        }

        this.getFriendList();
    }

    handleInput(value) {
        clearTimeout(this.debounceTimer);
        const query = value.trim();

        if (query.length < 2) {
            const resultsContainer = this.querySelector('#searchResults');
            if (resultsContainer) resultsContainer.innerHTML = '';
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.executeSearch(query);
        }, 300);
    }

    async executeSearch(query) {
        const token = await AuthService.getValidToken();
        try {
            const response = await fetch(`/api/users/search?username=${encodeURIComponent(query)}`, {
                method : 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
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
        if (!container) return;

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
            } else {
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
            if (rankComp && typeof rankComp.setPlayerInfo === 'function') {
                rankComp.setPlayerInfo(user);
            }
        });
    }

    async sendFriendRequest(targetUser, button) {
        button.disabled = true;
        button.innerText = "Envoi...";
        try {
            const fromUser = await AuthService.getValidToken();
            const response = await fetch(`/api/sendreq`, {
                method: 'POST',
                body: JSON.stringify({ to: targetUser }),
                headers: {
                    'Authorization': `Bearer ${fromUser}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log("[sendFriendRequest] response: ", response)

            if(response.ok){
                const result = await response.json();
                button.innerText = "Envoyé !";
                socket.emit("SEND_FRIEND_REQ", { to: targetUser });
            } else {
                button.disabled = false;
                button.innerText = "Ajouter";
            }
        } catch (error) {
            console.error("Erreur d'envoi de demande :", error);
            button.disabled = false;
            button.innerText = "Ajouter";
        }
    }

    async getFriendList(){
        try{
            const token = await AuthService.getValidToken();
            if (!token) return;
            const response = await fetch('/api/friends', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const friends = await response.json();
                this.friendList = friends;

                const friendListContainer = this.querySelector('#friendList');
                if (!friendListContainer) return;

                friendListContainer.innerHTML = '';

                friends.forEach(friend => {
                    const div = document.createElement('div');
                    div.className = 'friend-item';
                    div.innerHTML = `
                        <span class="username">${friend.username}</span>
                        <span class="rank"><player-rank></player-rank></span>
                        <button id="friendlyBtn">Défier</button>
                        <button class="remove-btn">Retirer</button>
                    `;
                    friendListContainer.appendChild(div);
                    const friendlyBtn = div.querySelector("#friendlyBtn");
                    friendlyBtn.addEventListener("click", () => {
                        friendlyBtn.innerHTML = "...";
                        friendlyBtn.disabled = true;
                        socket.emit("invite-friendly", {to : friend.username});
                        socket.on("invitation-sent", () => {
                            friendlyBtn.innerHTML = "Défié !";
                        })
                        localStorage.setItem('matchMode', 'friendly');
                    })

                    const rankComp = div.querySelector('player-rank');
                    if (rankComp && typeof rankComp.setPlayerInfo === 'function') {
                        rankComp.setPlayerInfo(friend);
                    }

                    div.querySelector('.remove-btn').addEventListener('click', async (e) => {
                        // attendre la requête vers le backend
                        const success = await RequestService.deleteFriend(friend.username);

                        if (success) {
                            // Mettre à jour la liste interne d'amis
                            this.friendList = this.friendList.filter(f => f.username !== friend.username);

                            // Retirer l'élément DOM correspondant
                            div.remove();

                            // Si l'utilisateur a une recherche active, relancer la recherche
                            const inputEl = this.querySelector('#input');
                            const currentQuery = inputEl ? inputEl.value.trim() : '';
                            if (currentQuery.length >= 2) {
                                // relancer la recherche pour rafraîchir les boutons "+ Ajouter"
                                this.executeSearch(currentQuery);
                            }

                            // optionnel : notifier d'autres composants si besoin
                            window.dispatchEvent(new Event('friendlist-changed'));
                        } else {
                            // échec : tu peux afficher un message / animation ou réactiver le bouton
                            console.error("Erreur lors de la suppression d'ami");
                        }
                    });
                });
            }
        } catch (error) {
            console.error("Erreur de recherche de la liste d'amis :", error);
        }
    }
}

customElements.define('social-component', SOCIALComponent);