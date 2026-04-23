import { socket } from "../../socket.js";
import { RequestService } from "../../services/RequestService.js";
import { AuthService } from "../../services/AuthService.js";
import { API_URL } from "../../../config.js";

export class SOCIALComponent extends HTMLElement {
    constructor() {
        super();
        this.debounceTimer = null;
        this.friendList = [];
        this._socketListeners = [];
    }

    RANK_SHORT = {
        "1ère année": "1A", "2ème année": "2A", "3ème année": "3A",
        "4ème année": "4A", "5ème année": "5A", "6ème année": "6A",
        "7ème année": "7A", "Non classé": "?"
    };

    async connectedCallback() {
        const htmlUrl = new URL('./social-component.html', import.meta.url);
        const cssUrl = new URL('./social-component.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `<link rel="stylesheet" href="${cssUrl.href}">${html}`;

        this.initComponent();
        this.setupMobileEvents();
        this.fetchMyRequests();
        this.setupSocketListeners();
    }

    disconnectedCallback() {
        this._socketListeners.forEach(({ event, fn }) => socket.off(event, fn));
        this._socketListeners = [];
        window.removeEventListener('friendrequests-changed', this._onFriendRequestsChanged);
    }


    initComponent() {
        ['#inputPC', '#inputMobile'].forEach(sel => {
            const input = this.querySelector(sel);
            if (input) {
                input.addEventListener('input', () => this.handleInput(input.value));
            }
        });

        this.getFriendList();
    }


    setupSocketListeners() {
        const onNewFriendReq = (data) => {
            console.log('Nouvelle demande d\'ami reçue de :', data.from);
            this.fetchMyRequests();
            window.dispatchEvent(new Event('friendrequests-changed'));
        };

        socket.on('NEW_FRIEND_REQ', onNewFriendReq);
        this._socketListeners.push({ event: 'NEW_FRIEND_REQ', fn: onNewFriendReq });
    }


    handleInput(value) {
        clearTimeout(this.debounceTimer);
        const query = value.trim();

        if (query.length < 2) {
            ['#searchResultsPC', '#searchResultsMobile'].forEach(sel => {
                const el = this.querySelector(sel);
                if (el) el.innerHTML = '';
            });
            return;
        }

        this.debounceTimer = setTimeout(() => this.executeSearch(query), 300);
    }

    async executeSearch(query) {
        const token = await AuthService.getValidToken();
        try {
            const response = await fetch(
                API_URL + `/api/users/search?username=${encodeURIComponent(query)}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (response.ok) {
                const users = await response.json();
                this.displayResults(users);
            }
        } catch (error) {
            console.error('Erreur de recherche :', error);
        }
    }

    displayResults(users) {
        const isMobile = document.body.classList.contains('is-android');

        ['#searchResultsPC', '#searchResultsMobile'].forEach(sel => {
            const container = this.querySelector(sel);
            if (!container) return;

            container.innerHTML = '';

            if (users.length < 1) {
                container.innerHTML = '<div class="username" style="font-size:1em;">Aucun sorcier trouvé...</div>';
                return;
            }

            users.forEach(user => {
                const div = document.createElement('div');
                div.className = 'search-item';
                const isFriend = this.friendList.some(f => f.username === user.username);

                if (isMobile) {
                    div.innerHTML = `
                    <span class="username">${user.username}</span>
                    <span class="rank"><player-rank></player-rank></span>
                    <span class="rank-short">${this.RANK_SHORT[user.rank] ?? "?"}</span>
                    ${isFriend ? '' : '<button class="add-btn">+ Ajouter</button>'}
                `;
                } else {
                    div.innerHTML = `
                    <span class="username">${user.username}</span>
                    <span class="rank"><player-rank></player-rank></span>
                    ${isFriend ? '' : '<button class="add-btn">+ Ajouter</button>'}
                `;
                }

                const btn = div.querySelector('.add-btn');
                if (btn) btn.addEventListener('click', () => this.sendFriendRequest(user.username, btn));

                container.appendChild(div);

                const rank = div.querySelector('player-rank');
                if (rank && typeof rank.setPlayerInfo === 'function') rank.setPlayerInfo(user);
            });
        });
    }


    async sendFriendRequest(targetUser, button) {
        button.disabled = true;
        button.innerText = 'Envoi...';
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
                button.innerText = 'Envoyé !';
                socket.emit('SEND_FRIEND_REQ', { to: targetUser });
                console.log('Notification de demande envoyée à :', targetUser);
            } else {
                button.disabled = false;
                button.innerText = '+ Ajouter';
            }
        } catch (error) {
            console.error('Erreur d\'envoi de demande :', error);
            button.disabled = false;
            button.innerText = '+ Ajouter';
        }
    }


    async getFriendList() {
        try {
            const token = await AuthService.getValidToken();
            if (!token) return;

            const response = await fetch(API_URL + '/api/friends', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const friends = await response.json();
                this.friendList = friends;

                const count = this.querySelector('#friendCount');
                if (count) count.innerText = friends.length;

                ['#friendListPC', '#friendListMobile'].forEach(sel => {
                    const container = this.querySelector(sel);
                    if (container) this.renderFriends(friends, container);
                });
            }
        } catch (error) {
            console.error('Erreur récupération liste d\'amis :', error);
        }
    }

    renderFriends(friends, container) {
        const isMobile = document.body.classList.contains('is-android');
        container.innerHTML = '';

        if (friends.length === 0) {
            container.innerHTML = `<div class="username" style="font-size:0.9em;opacity:0.5;text-align:center;padding:1rem;">
            Aucun ami pour l'instant...
        </div>`;
            return;
        }

        friends.forEach(friend => {
            const div = document.createElement('div');
            div.className = 'friend-item';

            if (isMobile) {
                div.innerHTML = `
                <span class="username">${friend.username}</span>
                <span class="rank"><player-rank></player-rank></span>
                <span class="rank-short">${this.RANK_SHORT[friend.rank] ?? "?"}</span>
                <button id="friendlyBtn">Défier</button>
                <button class="remove-btn">Retirer</button>
            `;
            } else {
                div.innerHTML = `
                <span class="username">${friend.username}</span>
                <span class="rank"><player-rank></player-rank></span>
                <button id="friendlyBtn">Défier</button>
                <button class="remove-btn">Retirer</button>
            `;
            }

            const friendlyBtn = div.querySelector('#friendlyBtn');
            friendlyBtn.addEventListener('click', () => {
                friendlyBtn.innerHTML = '...';
                friendlyBtn.disabled = true;
                socket.emit('invite-friendly', { to: friend.username });
                socket.once('invitation-sent', () => { friendlyBtn.innerHTML = 'Défié !'; });
                localStorage.setItem('matchMode', 'friendly');
            });

            div.querySelector('.remove-btn').addEventListener('click', async () => {
                const success = await RequestService.deleteFriend(friend.username);
                if (success) {
                    this.friendList = this.friendList.filter(f => f.username !== friend.username);
                    div.remove();
                    const inputPC = this.querySelector('#inputPC');
                    const inputMobile = this.querySelector('#inputMobile');
                    const currentQuery = (inputPC?.value || inputMobile?.value || '').trim();
                    if (currentQuery.length >= 2) this.executeSearch(currentQuery);
                    window.dispatchEvent(new Event('friendlist-changed'));
                    const count = this.querySelector('#friendCount');
                    if (count) count.innerText = parseInt(count.innerText || '0') - 1;
                }
            });

            container.appendChild(div);

            const rank = div.querySelector('player-rank');
            if (rank && typeof rank.setPlayerInfo === 'function') rank.setPlayerInfo(friend);
        });
    }


    async fetchMyRequests() {
        try {
            const token = await AuthService.getValidToken();
            const response = await fetch(API_URL + `/api/requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const requests = await response.json();
                const count = this.querySelector('#reqCount');
                if (count) count.innerText = requests.length;
                this.displayRequests(requests);
            }
        } catch (error) {
            console.error('Erreur récupération demandes :', error);
        }
    }

    displayRequests(requests) {
        const isMobile = document.body.classList.contains('is-android');
        const list = this.querySelector('#reqListMobile');
        if (!list) return;

        list.innerHTML = '';

        if (requests.length === 0) {
            list.innerHTML = `<div class="username" style="font-size:0.8em;text-align:center;width:100%;opacity:0.5;padding:0.8rem 0;">
            Aucune demande
        </div>`;
            return;
        }

        requests.forEach(user => {
            const div = document.createElement('div');
            div.className = 'search-item';

            if (isMobile) {
                div.innerHTML = `
                <span class="username">${user.username}</span>
                <span class="rank"><player-rank></player-rank></span>
                <span class="rank-short">${this.RANK_SHORT[user.rank] ?? "?"}</span>
                <button class="accept-btn">Accepter</button>
                <button class="deny-btn">Refuser</button>
            `;
            } else {
                div.innerHTML = `
                <span class="username">${user.username}</span>
                <span class="rank"><player-rank></player-rank></span>
                <button class="accept-btn">Accepter</button>
                <button class="deny-btn">Refuser</button>
            `;
            }

            const rank = div.querySelector('player-rank');
            if (rank && typeof rank.setPlayerInfo === 'function') rank.setPlayerInfo(user);

            div.querySelector('.accept-btn').addEventListener('click', async (e) => {
                const success = await RequestService.handleDecision(user.username, 'accept');
                if (success) {
                    e.target.innerText = 'Fait !';
                    e.target.disabled = true;
                    div.querySelector('.deny-btn').style.display = 'none';
                    setTimeout(() => {
                        div.remove();
                        this.fetchMyRequests();
                        this.getFriendList();
                    }, 800);
                }
            });

            div.querySelector('.deny-btn').addEventListener('click', async () => {
                const success = await RequestService.handleDecision(user.username, 'deny');
                if (success) {
                    div.remove();
                    this.fetchMyRequests();
                }
            });

            list.appendChild(div);
        });
    }


    setupMobileEvents() {
        const toggles = {
            'toggleRequests': 'reqListMobile',
            'toggleFriends': 'friendListMobile'
        };

        Object.entries(toggles).forEach(([btnId, listId]) => {
            const btn = this.querySelector(`#${btnId}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    const list = this.querySelector(`#${listId}`);
                    if (list) list.classList.toggle('hidden-mobile');
                });
            }
        });
        this._onFriendRequestsChanged = () => this.fetchMyRequests();
        window.addEventListener('friendrequests-changed', this._onFriendRequestsChanged);
    }
}

customElements.define('social-component', SOCIALComponent);