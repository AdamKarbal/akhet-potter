import { audioService } from "../../services/AudioService.js";
import {connectSocket, socket} from "../../socket.js";
import { AuthService } from "../../services/AuthService.js";
import {API_URL} from "../../../config.js";
import {RankProgressBar} from "../../components/progression-bar/progression-bar.js";

export class HomePage extends HTMLElement{
    constructor() {
        super();
        this.gameMode = null;
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
                    window.location.hash = (token && username) ? 'LGN' : 'LGN';
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
                    console.log("on cherhce uen game");
                    socket.emit("find-game");
                };
            }

            const btnJouerJco = this.querySelector("#btn-jouer-jco");
            if (btnJouerJco) {
                btnJouerJco.onclick = () => { window.location.hash = 'JCO'; };
            }

            if(document.body.classList.contains('is-android')) {
                const localsec = this.querySelector("#local");
                const jcjsec = this.querySelector("#jcj");
                const jcosec = this.querySelector("#jco");
                const button = document.createElement("button");
                button.classList.add('play-btn');
                button.innerText = `Jouer`;
                this.querySelector(".main-section").appendChild(button);

                localsec.addEventListener("click", async () => {
                    animateText('local');
                    button.style.filter = "grayscale(100%)";
                    button.innerText = `JOUER`;
                    button.disabled = true;
                    this.gameMode = 'LOC';
                    localsec.classList.add('selected');
                    jcjsec.classList.remove('selected');
                    jcosec.classList.remove('selected');
                });
                jcjsec.addEventListener("click", async () => {
                    this.gameMode = 'JCJ';
                    animateText('jcj');
                    if(!await AuthService.getValidToken()){
                        button.style.filter = "none";
                        button.disabled = false;
                        button.innerText = `SE CONNECTER`;
                    }
                    localsec.classList.remove('selected');
                    jcjsec.classList.add('selected');
                    jcosec.classList.remove('selected');
                });
                jcosec.addEventListener("click", async () => {
                    button.innerText = `JOUER`;
                    animateText('jco');
                    button.style.filter = "none";
                    button.disabled = false;
                    this.gameMode = 'JCO';
                    localsec.classList.remove('selected');
                    jcjsec.classList.remove('selected');
                    jcosec.classList.add('selected');
                });

                const userSection = this.querySelector(".user-rank");
                if (userSection) {
                    userSection.addEventListener("click", async () => {
                        if(await AuthService.getValidToken()){
                           window.location.hash = 'PROF';
                        }
                        else{
                            window.location.hash = 'LGN';
                        }
                    })
                }

                const descriptions = {
                    local: "Entraînez-vous localement sur votre appareil. Parfait pour tester de nouvelles stratégies de lancer sans pression.",
                    jcj: "Affrontez des sorciers du monde entier en temps réel. Grimpez dans le classement pour atteindre la 7ème année !",
                    jco: "Défiez l'Intelligence Artificielle. Un adversaire redoutable qui ne connaît pas la fatigue ni la pitié."
                };

                let typingInterval = null;

                const animateText = (id) => {
                    const descElement = this.querySelector('.game-mode-desc-mobile');
                    if (!descElement) return;

                    const text = descriptions[id] || "";
                    descElement.textContent = "";
                    clearInterval(typingInterval);

                    let index = 0;
                    typingInterval = setInterval(() => {
                        if (index < text.length) {
                            descElement.textContent += text.charAt(index);
                            index++;
                        } else {
                            clearInterval(typingInterval);
                        }
                    }, 10);
                };

                button.addEventListener("click", async () => {
                    if (button.innerText === "SE CONNECTER") {
                        window.location.hash = 'LGN';
                    } else if (this.gameMode === 'JCJ') {
                        localStorage.setItem('matchMode', 'ranked');
                        await connectSocket();
                        socket.emit("find-game");
                    } else {
                        window.location.hash = this.gameMode;
                    }
                });
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
                    'Authorization': `Bearer ${token}`
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
                    <img class="payloadimg" src="assets/goodplayer.webp">
                    <span class="payloadtext">${ username ? username : "Invité"}</span>`;
        usernameDiv.classList.add('username-card');
        section.appendChild(usernameDiv);

        const rankDiv = document.createElement('div');
        rankDiv.classList.add('rank');
        rankDiv.innerHTML = `
                    <img class="payloadimg" src="${imgPath}">
                    <span class="payloadtext">${rank ? rank : "Non classé"}</span>`;
        if(!rank) rankDiv.classList.add('unavailable');
        section.appendChild(rankDiv);

        const eloDiv = document.createElement('div');
        eloDiv.innerHTML = `
                    <img class="payloadimg" src="assets/vifdor-1.webp">
                    <span class="payloadtext">${elo ? elo : "---"}</span>`;
        eloDiv.classList.add('elo');
        section.appendChild(eloDiv);

        const progBar = document.createElement('progression-bar');
        section.appendChild(progBar);

        progBar.updateProgress(rank, elo);

        if(rank && elo && username){
            this.applyConnectedState(username);
        }
        else{
            this.applyDisconnectedState();
        }
    }
}

customElements.define('home-page', HomePage);