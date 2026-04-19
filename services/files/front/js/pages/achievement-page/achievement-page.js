import '../../components/navbar-component/navbar-component.js';
import '../../components/achievement-item/achievement-item.js';
import { API_URL } from "../../../config.js";

export class AchievementPage extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./achievement-page.html', import.meta.url);
        const cssUrl = new URL('./achievement-page.css', import.meta.url);

        try {
            const [htmlResponse] = await Promise.all([
                fetch(htmlUrl)
            ]);

            const html = await htmlResponse.text();

            this.innerHTML = `
                <link rel="stylesheet" href="${cssUrl.href}">
                ${html}
            `;

            this.setupEventListeners();
            this.loadAchievements();
            const usernameSpan = this.querySelector('#username');
            const token = localStorage.getItem('token');
            if (token && localStorage.getItem('username')) {
                usernameSpan.innerText = localStorage.getItem('username');
            }
        } catch (error) {
            console.error("Failed to load achievement page resources:", error);
        }
    }

    setupEventListeners() {
        const btnLogin = this.querySelector("#btn-login");
        if (btnLogin) {
            btnLogin.addEventListener("click", () => {
                window.location.hash = 'LGN';
            });
        }
    }

    async loadAchievements() {
        const grid = this.querySelector('#achievements-list');
        if (!grid) return;
        const token = localStorage.getItem('token');

        // Verifie si le joueur est co
        if (!token) {
            grid.innerHTML = `<p style="color: #ffd700; font-family: 'Agency FB'; font-size: 1.5em; text-align: center; width: 100%; grid-column: 1 / -1;">
                Veuillez vous connecter pour consulter la Salle des Trophées.
            </p>`;
            return;
        }
        grid.innerHTML = `<p style="color: #ffd700; font-family: 'Agency FB'; font-size: 1.5em; text-align: center; width: 100%; grid-column: 1 / -1;">
            Chargement de vos exploits magiques...
        </p>`;

        try {
            const response = await fetch(`${API_URL}/api/achievements`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const achievements = await response.json();
                grid.innerHTML = '';

                // Création composant
                achievements.forEach(ach => {
                    const item = document.createElement('achievement-item');
                    item.setAttribute('title', ach.title);
                    item.setAttribute('description', ach.desc);
                    item.setAttribute('icon', ach.icon);
                    item.setAttribute('unlocked', ach.unlocked.toString());
                    grid.appendChild(item);
                });
            } else {
                grid.innerHTML = `<p style="color: #ff4444; font-family: 'Agency FB'; font-size: 1.5em; text-align: center; width: 100%; grid-column: 1 / -1;">
                    Impossible de récupérer vos succès. Essayez de vous reconnecter.
                </p>`;
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des succès :", error);
            grid.innerHTML = `<p style="color: #ff4444; font-family: 'Agency FB'; font-size: 1.5em; text-align: center; width: 100%; grid-column: 1 / -1;">
                Le Ministère de la Magie (Serveur) ne répond pas.
            </p>`;
        }
    }
}

customElements.define('achievement-page', AchievementPage);