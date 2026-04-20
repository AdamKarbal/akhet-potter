import { audioService } from "../../services/AudioService.js";
import { socket } from "../../socket.js";
import { AuthService } from "../../services/AuthService.js";
import {API_URL} from "../../../config.js";

export class HomePage extends HTMLElement{

    constructor() {
        super();
    }

    RANK_MAPPER = {
        "Non classé" : 'assets/webp/unranked.webp', //TODO:AJOUTER LASSEt
        "1ère année" : 'assets/annee1.webp',
        "2ème année" : 'assets/annee2.webp',
        "3ème année" : 'assets/annee3.webp',
        "4ème année" : 'assets/annee4.webp',
        "5ème année" : 'assets/annee5.webp',
        "6ème année" : 'assets/annee6.webp',
        "7ème année" : 'assets/annee7.webp'
    };

    RANK_ORDER = ["1ère année", "2ème année", "3ème année", "4ème année", "5ème année", "6ème année", "7ème année"];

    async connectedCallback(){
        const htmlUrl = new URL('./home-page.html', import.meta.url);
        const cssUrl = new URL('./home-page.css', import.meta.url);
        
        try {
            const [htmlResponse] = await Promise.all([
                fetch(htmlUrl)
            ]);

            const html = await htmlResponse.text();

            this.innerHTML = `
                <link rel="stylesheet" href="${cssUrl.href}">
                ${html}
            `;

            socket.emit("quit");

            const userSection = this.querySelector(".user-section");
            if (userSection) {
                userSection.addEventListener("click", () => {
                    const token = localStorage.getItem('token');
                    const username = localStorage.getItem('username');
                    window.location.hash = (token && username) ? 'SUCCES' : 'LGN';
                });
            }

            const btnLogout = this.querySelector("#btn-logout");
            if (btnLogout) {
                btnLogout.addEventListener("click", async () => {
                    const token = localStorage.getItem('token');
                    try {
                        const res = await fetch(API_URL + "/api/logout", {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if(res){
                            localStorage.clear();
                            this.applyDisconnectedState();
                            this.fillUserInfo();
                        }
                    } catch (e) {}
                    localStorage.clear();
                    this.applyDisconnectedState();
                    this.fillUserInfo();
                });
            }

            const btnJouerJcj = this.querySelector("#btn-jouer-jcj");
            if (btnJouerJcj) {
                btnJouerJcj.onclick = () => {
                    const token = localStorage.getItem('token');
                    if(!token) { window.location.hash = 'LGN'; return; }
                    localStorage.setItem('matchMode', 'ranked');
                    socket.emit("find-game");
                };
            }

            const btnJouerJco = this.querySelector("#btn-jouer-jco");
            if (btnJouerJco) {
                btnJouerJco.onclick = () => { window.location.hash = 'JCO'; };
            }

            audioService.playMainTheme();
            this.retrievePlayerInfo();
            
        } catch (error) {
            console.error("Failed to load home page resources:", error);
        }
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
        const usernameEl = this.querySelector("#username");
        if (usernameEl) usernameEl.innerHTML = username;
        const btnLogout = this.querySelector("#btn-logout");
        if (btnLogout) btnLogout.style.display = "flex";
        const btnJcj = this.querySelector("#btn-jouer-jcj");
        if (btnJcj) {
            btnJcj.disabled = false;
            btnJcj.style.filter = '';
            btnJcj.style.pointerEvents = '';
        }
    }

    applyDisconnectedState() {
        this.clearConnectionIndicators();
        const dot = document.createElement('span');
        dot.classList.add('disconnected');
        const userSection = this.querySelector(".user-section");
        if (userSection) userSection.appendChild(dot);
        const usernameEl = this.querySelector("#username");
        if (usernameEl) usernameEl.innerHTML = "Se connecter";
        const btnLogout = this.querySelector("#btn-logout");
        if (btnLogout) btnLogout.style.display = "none";
        const btnJcj = this.querySelector("#btn-jouer-jcj");
        if (btnJcj) {
            btnJcj.disabled = true;
            btnJcj.style.filter = 'grayscale(100%) opacity(0.5)';
            btnJcj.style.pointerEvents = 'none';
        }
    }

    async retrievePlayerInfo(){
        const rankSection = this.querySelector(".user-rank");
        if (!rankSection) return;
        const token = await AuthService.getValidToken();
        const user = localStorage.getItem('username');

        if (!token || !user) {
            rankSection.innerHTML = '';
            this.applyDisconnectedState();
            this.fillUserInfo();
            return;
        }

        try {
            const response = await fetch(API_URL + `/api/users/search?username=${user}&t=${Date.now()}`, {
                headers : {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });

            if(response.ok) {
                const users = await response.json();
                const u = users?.[0];
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
        const unkProg = 'assets/webp/unknownprog.webp';

        const section = this.querySelector(".user-rank");
        const imgPath = rank ? this.RANK_MAPPER[rank] : this.RANK_MAPPER["Non classé"];
        const progressPercent = elo? ((elo % 1000) / 1000) * 100 : ((0 % 1000) / 1000) * 100;
        const nextRankIndex = this.RANK_ORDER.indexOf(rank) + 1;
        const nextRankImg = rank ? this.RANK_MAPPER[this.RANK_ORDER[nextRankIndex]] : unkProg;

        section.innerHTML = '';

        const usernameDiv = document.createElement('div');
        usernameDiv.innerHTML = `
                    <img style="width:20%" src="assets/goodplayer.webp">
                    <span>${ username ? username : "Invité"}</span>`;
        usernameDiv.classList.add('username-card');
        section.appendChild(usernameDiv);

        const rankDiv = document.createElement('div');
        rankDiv.classList.add('rank');
        rankDiv.innerHTML = `
                    <img style="width:20%" src="${imgPath}">
                    <span>${rank ? rank : "Non classé"}</span>`;
        if(!rank) rankDiv.classList.add('unavailable');
        section.appendChild(rankDiv);

        const eloDiv = document.createElement('div');
        eloDiv.innerHTML = `
                    <img style="width:25%" src="assets/vifdor-1.webp">
                    <span>${elo ? elo : "---"}</span>`;
        eloDiv.classList.add('elo');
        section.appendChild(eloDiv);

        const progDiv = document.createElement('div');
        progDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img style="width:10%" src="${rank ? imgPath : unkProg}">
                        <div class="progress-bg">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <img style="width:10%" src="${rank? nextRankImg : unkProg}">
                    </div>`;
        progDiv.classList.add('prog');
        section.appendChild(progDiv);

        if(rank && elo && username){
            this.applyConnectedState(username);
        }
        else{
            this.applyDisconnectedState();
        }
    }
}

customElements.define('home-page', HomePage);