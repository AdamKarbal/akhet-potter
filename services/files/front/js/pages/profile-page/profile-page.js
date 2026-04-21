import {API_URL} from "../../../config.js";
import { AuthService } from "../../services/AuthService.js";
import { RankProgressBar} from "../../components/progression-bar/progression-bar.js";
import { NavbarComponent} from "../../components/navbar-component/navbar-component.js";

export class ProfilePage extends HTMLElement {
    constructor() {
        super();
        this.RANK_MAPPER = {
            "Non classé" : 'assets/webp/unranked.webp',
            "1ère année" : 'assets/annee1.webp',
            "2ème année" : 'assets/annee2.webp',
            "3ème année" : 'assets/annee3.webp',
            "4ème année" : 'assets/annee4.webp',
            "5ème année" : 'assets/annee5.webp',
            "6ème année" : 'assets/annee6.webp',
            "7ème année" : 'assets/annee7.webp'
        };
    }

    async connectedCallback() {
        const htmlUrl = new URL('./profile-page.html', import.meta.url);
        const cssUrl = new URL('./profile-page.css', import.meta.url);

        try {
            const [htmlRes, cssRes] = await Promise.all([
                fetch(htmlUrl),
                fetch(cssUrl)
            ]);

            const html = await htmlRes.text();
            const css = await cssRes.text();

            this.innerHTML = `<style>${css}</style>${html}`;

            await this.retrievePlayerInfo();

        } catch (error) {
            console.error('[Profile] ERREUR:', error);
        }


    }

    async retrievePlayerInfo(){
        const token = await AuthService.getValidToken();
        const user = localStorage.getItem('username');

        if (!token || !user) {
            this.fillUserInfo();
            return;
        }

        try {
            const response = await fetch(API_URL + `/api/users/search?username=${user}&t=${Date.now()}`, {
                headers : {
                    'Authorization': `Bearer ${token}`
                }
            });

            if(response.ok) {
                const users = await response.json();
                const u = users?.[0];

                console.log("user", u);

                if (!u) {
                    rankSection.innerHTML = '';
                    this.applyDisconnectedState();
                    localStorage.clear();
                    return;
                }
                this.fillUserInfo(u.rank, u.elo, u.username);
            }
        }
        catch(error) {
            console.error("Erreur lors de la récupération des infos joueur:", error);
            this.applyDisconnectedState();
            this.fillUserInfo();
        }
    }

    fillUserInfo(rank, elo, username) {
        // 1. On remplit le nom
        const usernameEl = this.querySelector(".username");
        if (usernameEl) usernameEl.innerText = username;

        const rankImg = this.querySelector("#rankImg");
        if (rankImg) rankImg.src = this.RANK_MAPPER[rank] || this.RANK_MAPPER["Non classé"];

        // 2. On remplit l'image de rang
        const actRankImg = this.querySelector("#rank img");
        if (actRankImg) actRankImg.src = this.RANK_MAPPER[rank] || this.RANK_MAPPER["Non classé"];

        // 3. On remplit l'ELO
        const eloEl = this.querySelector("#elo");
        if (eloEl) eloEl.textContent = `${elo} points`;

        // 4. On met à jour le Web Component de la barre de progression
        const progBar = this.querySelector("progression-bar");
        if (progBar) {
            progBar.updateProgress(rank, elo);
        }
    }
}

customElements.define('profile-page', ProfilePage);