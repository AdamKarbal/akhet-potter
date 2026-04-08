import '../../components/navbar-component/navbar-component.js';
import '../../components/achievement-item/achievement-item.js';
import { API_URL } from "../../../config.js";

export class AchievementPage extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <style>
                @font-face {
                    font-family: 'HarryPotter';
                    src: url('/assets/fonts/HARRYP__.TTF') format('truetype');
                }
                
                body {
                    background-image: url("/assets/background1v1.webp");
                    background-size: 100% 100%;
                    background-repeat: no-repeat;
                    min-height: 100vh;
                    margin: 0;
                }

                .home-container {
                    display: grid;
                    grid-template-columns: 5% 95%;
                    width: 100vw;
                    height: 100vh;
                }
                
                #nav { grid-column: 1; }
                
                .main-section {
                    grid-column: 2;
                    display: grid;
                    /* 10vh Profil | 15vh Titre | 70vh Cadre Succès | 5vh marge bas */
                    grid-template: 10vh 15vh 70vh 5vh / 100%;
                }     
                
                .user-log {
                    display: flex;
                    flex-direction: row;
                    justify-content: flex-end;
                    align-items: center;
                    padding-right: 25px;
                    grid-row: 1;
                }
                
                .user-section {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: center;
                    width: fit-content;
                    height: 60%;
                    gap: 0.75rem;
                    padding: 0 1vw;
                    border: 2px double #c5a059;
                    border-radius: 40px;
                    box-shadow: 0 0 2.5px #d4af37, inset 0 0 5px rgba(212, 175, 55, 0.3);
                    font-family: 'Agency FB', sans-serif;
                    font-size: 1.2em;
                    color: #FFD700;
                    background-color: rgba(0,0,0, 0.4);   
                    cursor: pointer;
                    transition: all 0.3s ease;  
                }
                
                .user-section:hover {
                    transform: scale(1.05); 
                    background-color: rgba(212, 175, 55, 0.15); 
                    box-shadow: 0 0 15px #ffd700, inset 0 0 10px rgba(212, 175, 55, 0.5);
                }

                #pfp { max-height: 70%; width: auto; }

                .page-title {
                    grid-row: 2;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: 'HarryPotter', sans-serif;
                    font-size: 5em;
                    color: #FFD700;
                    text-shadow: 0 0 15px rgba(255, 215, 0, 0.5), 2px 2px 4px #000;
                    margin: 0;
                    letter-spacing: 3px;
                }

                .achievements-frame {
                    grid-row: 3;
                    width: 85%;
                    height: 100%;
                    justify-self: center;
                    background-color: rgba(10, 5, 0, 0.65);
                    border: 3px double #c5a059;
                    border-radius: 15px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.8), inset 0 0 30px rgba(212, 175, 55, 0.1);
                    padding: 2rem;
                    box-sizing: border-box;
                                        overflow-y: auto; 
                }

                .achievements-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 2rem;
                }

                .achievements-frame::-webkit-scrollbar {
                    width: 12px;
                }
                .achievements-frame::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 10px;
                    border: 1px solid #4a3b2a;
                }
                .achievements-frame::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, #c5a059, #8B4513);
                    border-radius: 10px;
                    border: 1px solid #ffd700;
                }
                .achievements-frame::-webkit-scrollbar-thumb:hover {
                    background: #ffd700;
                }

            </style>
            
            <div class="home-container">
                <navbar-component id="nav"></navbar-component>
                
                <div class="main-section">
                    <div class="user-log">
                        <div class="user-section" id="btn-login">         
                            <img id="pfp" src="assets/webp/goodplayer.webp">
                            <span id="username">Se connecter</span>
                        </div>
                    </div>
                    
                    <h1 class="page-title">Salle des Trophees</h1>
                    
                    <div class="achievements-frame">
                        <div class="achievements-grid" id="achievements-list">
                            </div>
                    </div>
                </div> 
            </div>
        `;

        this.setupEventListeners();
        this.loadAchievements();
        const usernameSpan = this.querySelector('#username');
        const token = localStorage.getItem('token');
        if (token && localStorage.getItem('username')) {
            usernameSpan.innerText = localStorage.getItem('username');
        }
    }

    setupEventListeners() {
        this.querySelector("#btn-login").addEventListener("click", () => {
            window.location.hash = 'LGN';
        });
    }

    async loadAchievements() {
        const grid = this.querySelector('#achievements-list');
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