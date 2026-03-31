import { socket } from "../../socket.js";
import { RequestService } from "../../services/RequestService.js";

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
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/users/search?username=${encodeURIComponent(query)}`, {
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
            const fromUser = localStorage.getItem('token');
            const response = await fetch(`/api/sendreq`, {
                method: 'POST',
                body: JSON.stringify({ to: targetUser }),
                headers: {
                    'Authorization': `Bearer ${fromUser}`,
                    'Content-Type': 'application/json'
                }
            });

            if(response.ok) {
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

    async getFriendList() {
        try {
            const token = localStorage.getItem('token');
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
                        <button class="remove-btn">Retirer</button>
                    `;
                    friendListContainer.appendChild(div);

                    const rankComp = div.querySelector('player-rank');
                    if (rankComp && typeof rankComp.setPlayerInfo === 'function') {
                        rankComp.setPlayerInfo(friend);
                    }

                    div.querySelector('.remove-btn').addEventListener('click', async (e) => {
                        const success = await RequestService.deleteFriend(friend.username);
                        if(success) {
                            div.remove();
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