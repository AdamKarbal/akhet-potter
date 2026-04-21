import { socket } from "../../socket.js";
import { RequestService } from "../../services/RequestService.js";
import { AuthService } from "../../services/AuthService.js";
import { API_URL } from "../../../config.js";

export class SOCIALComponent extends HTMLElement {
    constructor() {
        super();
        this.debounceTimer = null;
        this.friendList = [];
    }

    async connectedCallback() {
        const htmlUrl = new URL('./social-component.html', import.meta.url);
        const cssUrl = new URL('./social-component.css', import.meta.url);

        try {
            const response = await fetch(htmlUrl);
            const html = await response.text();

            this.innerHTML = `
                <link rel="stylesheet" href="${cssUrl.href}">
                ${html}
            `;

            this.initComponent();
            this.setupMobileEvents();
            this.fetchMyRequests();
        } catch (error) {
            console.error("Erreur lors du chargement du composant Social :", error);
        }
    }

    initComponent() {
        // On écoute les deux inputs (PC et Mobile) au cas où
        const inputs = this.querySelectorAll('#input, #inputPC, #inputMobile');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.handleInput(input.value));
        });

        this.getFriendList();
    }

    handleInput(value) {
        clearTimeout(this.debounceTimer);
        const query = value.trim();

        if (query.length < 2) {
            this.clearSearchResults();
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.executeSearch(query);
        }, 300);
    }

    clearSearchResults() {
        const containers = this.querySelectorAll('#searchResults, #searchResultsPC, #searchResultsMobile');
        containers.forEach(c => c.innerHTML = '');
    }

    async executeSearch(query) {
        const token = await AuthService.getValidToken();
        try {
            const response = await fetch(API_URL + `/api/users/search?username=${encodeURIComponent(query)}`, {
                method: 'GET',
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
        const containers = this.querySelectorAll('#searchResults, #searchResultsPC, #searchResultsMobile');

        containers.forEach(container => {
            container.innerHTML = '';

            if (users.length < 1) {
                container.innerHTML = '<div class="username" style="font-size: 1em;">Aucun sorcier trouvé...</div>';
                return;
            }

            users.forEach(user => {
                const div = document.createElement('div');
                div.className = 'search-item';
                const isAlreadyFriend = this.friendList.some(f => f.username === user.username);

                div.innerHTML = `
                    <span class="username">${user.username}</span>
                    <span class="rank"><player-rank></player-rank></span>
                    ${isAlreadyFriend ? '' : '<button class="add-btn">+ Ajouter</button>'}
                `;

                const addBtn = div.querySelector('.add-btn');
                if (addBtn) {
                    addBtn.addEventListener('click', (e) => this.sendFriendRequest(user.username, e.target));
                }

                container.appendChild(div);
                const rankComp = div.querySelector('player-rank');
                if (rankComp && typeof rankComp.setPlayerInfo === 'function') {
                    rankComp.setPlayerInfo(user);
                }
            });
        });
    }

    async sendFriendRequest(targetUser, button) {
        button.disabled = true;
        button.innerText = "Envoi...";
        try {
            const token = await AuthService.getValidToken();
            const response = await fetch(API_URL + `/api/sendreq`, {
                method: 'POST',
                body: JSON.stringify({ to: targetUser }),
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                button.innerText = "Envoyé !";
                socket.emit("SEND_FRIEND_REQ", { to: targetUser });
            } else {
                button.disabled = false;
                button.innerText = "+ Ajouter";
            }
        } catch (error) {
            console.error("Erreur d'envoi de demande :", error);
            button.disabled = false;
            button.innerText = "+ Ajouter";
        }
    }

    async getFriendList() {
        try {
            const token = await AuthService.getValidToken();
            if (!token) return;
            const response = await fetch(API_URL + '/api/friends', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const friends = await response.json();
                this.friendList = friends;

                // Mise à jour du compteur mobile si présent
                const friendCountLabel = this.querySelector('#friendCount');
                if (friendCountLabel) friendCountLabel.innerText = friends.length;

                // Remplissage des listes (PC et Mobile)
                const containers = this.querySelectorAll('#friendList, #friendListPC, #friendListMobile');
                containers.forEach(container => this.renderFriendsInContainer(friends, container));
            }
        } catch (error) {
            console.error("Erreur récupération amis :", error);
        }
    }

    renderFriendsInContainer(friends, container) {
        container.innerHTML = '';
        friends.forEach(friend => {
            const div = document.createElement('div');
            div.className = 'friend-item';
            div.innerHTML = `
                <span class="username">${friend.username}</span>
                <span class="rank"><player-rank></player-rank></span>
                <button class="friendly-btn" id="friendlyBtn">Défier</button>
                <button class="remove-btn">Retirer</button>
            `;

            const friendlyBtn = div.querySelector("#friendlyBtn");
            friendlyBtn.addEventListener("click", () => {
                friendlyBtn.innerHTML = "...";
                friendlyBtn.disabled = true;
                socket.emit("invite-friendly", { to: friend.username });
                localStorage.setItem('matchMode', 'friendly');
                setTimeout(() => { friendlyBtn.innerHTML = "Défié !"; }, 500);
            });

            div.querySelector('.remove-btn').addEventListener('click', async () => {
                if (await RequestService.deleteFriend(friend.username)) {
                    this.getFriendList();
                    window.dispatchEvent(new Event('friendlist-changed'));
                }
            });

            container.appendChild(div);
            const rankComp = div.querySelector('player-rank');
            if (rankComp) rankComp.setPlayerInfo(friend);
        });
    }

    setupMobileEvents() {
        const toggles = {
            'toggleRequests': 'reqListMobile',
            'toggleFriends': 'friendListMobile'
        };

        Object.entries(toggles).forEach(([btnId, listId]) => {
            const btn = this.querySelector(`#${btnId}`);
            const list = this.querySelector(`#${listId}`);
            if (btn && list) {
                btn.onclick = () => list.classList.toggle('hidden-mobile');
            }
        });

        window.addEventListener('friendrequests-changed', () => this.fetchMyRequests());
    }

    async fetchMyRequests() {
        const token = await AuthService.getValidToken();
        try {
            const response = await fetch(API_URL + `/api/requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const requests = await response.json();

                const reqCountLabel = this.querySelector('#reqCount');
                if (reqCountLabel) reqCountLabel.innerText = requests.length;

                this.displayRequests(requests);
            }
        } catch (error) {
            console.error("Erreur requêtes :", error);
        }
    }

    displayRequests(requests) {
        const list = this.querySelector('#reqListMobile');
        if (!list) return;

        if (requests.length === 0) {
            list.innerHTML = `<div class="username" style="font-size:0.9em; opacity:0.6; padding:10px;">Aucune demande</div>`;
            return;
        }

        list.innerHTML = '';
        requests.forEach(user => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `
                <span class="username">${user.username}</span>
                <div style="display:flex; gap:5px;">
                    <button class="accept-btn">✓</button>
                    <button class="deny-btn">X</button>
                </div>
            `;

            div.querySelector('.accept-btn').onclick = async () => {
                if (await RequestService.handleDecision(user.username, "accept")) {
                    this.fetchMyRequests();
                    this.getFriendList();
                }
            };
            div.querySelector('.deny-btn').onclick = async () => {
                if (await RequestService.handleDecision(user.username, "deny")) {
                    this.fetchMyRequests();
                }
            };
            list.appendChild(div);
        });
    }
}

customElements.define('social-component', SOCIALComponent);