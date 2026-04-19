import { PlayerRank } from "../../components/rank/userRank.js";
import { NavbarComponent } from "../../components/navbar-component/navbar-component.js";
import {RequestService} from "../../services/RequestService.js";
import {AuthService} from "../../services/AuthService.js";

export class RequestComponent extends HTMLElement {
    constructor() {
        super();
        this.debounceTimer = null;
    }

    async connectedCallback() {
        const htmlUrl = new URL('./request-page.html', import.meta.url);
        const cssUrl = new URL('./request-page.css', import.meta.url);
        
        try {
            const [htmlResponse] = await Promise.all([
                fetch(htmlUrl)
            ]);

            const html = await htmlResponse.text();

            this.innerHTML = `
                <link rel="stylesheet" href="${cssUrl.href}">
                ${html}
            `;
            
            console.log("Composant RequestComponent injecté dans le DOM");
            this.fetchMyRequests();
            window.addEventListener('friendrequests-changed', () => {
                this.fetchMyRequests();
            });

        } catch (error) {
            console.error("Failed to load request page resources:", error);
        }
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
                <div class="emptyMsg">Pas de demande d'amis... (Pour l'instant !)</div>`;
            return;
        }
        
        list.innerHTML = '';

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