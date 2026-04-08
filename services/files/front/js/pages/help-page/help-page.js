export class HelpPage extends HTMLElement {
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
            
            html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden; /* Empêche le scroll parasite sur les bords */
                background-color: #140f0a; /* La couleur sombre de ton thème */
            }

        * {
            box-sizing: border-box; /* Évite que les bordures agrandissent les éléments */
        }

            .help-container {
                display: grid;
                grid-template-columns: 5% 95%;
                width: 100vw;
                height: 100vh;
                background-image: url("/assets/background1v1.webp");
                background-size: 100% 100%;
                background-repeat: no-repeat;
            }

            .main-content {
                grid-column: 2;
                padding: 4vh 5vw;
                overflow-y: auto;
                color: #FFD700;
                font-family: 'Agency FB', sans-serif;
            }

            /* Style Grimoire / Parchemin */
            .scroll-section {
                background-color: rgba(20, 15, 10, 0.85);
                border: 2px double #c5a059;
                border-radius: 15px;
                box-shadow: 0 0 20px #d4af37, inset 0 0 30px rgba(212, 175, 55, 0.2);
                padding: 30px;
                margin-bottom: 40px;
            }

            h1 {
                font-family: 'HarryPotter', sans-serif;
                font-size: 4em;
                text-align: center;
                margin-bottom: 30px;
                text-shadow: 0 0 10px #ffd700;
                letter-spacing: 3px;
            }

            h2 {
                font-family: 'HarryPotter', sans-serif;
                font-size: 2.5em;
                border-bottom: 1px solid #c5a059;
                margin-top: 30px;
                padding-bottom: 10px;
            }

            .rules-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
            }

            .piece-card {
                background: rgba(255, 215, 0, 0.05);
                border: 1px solid rgba(197, 160, 89, 0.5);
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
            }

            .piece-name {
                font-weight: bold;
                color: #fff;
                font-size: 1.2em;
                text-transform: uppercase;
                display: block;
                margin-bottom: 5px;
            }

            .ranked-list {
                list-style: none;
                padding: 0;
            }

            .league-item {
                display: flex;
                align-items: center;
                gap: 20px;
                padding: 10px;
                border-bottom: 1px solid rgba(197, 160, 89, 0.3);
            }

            .league-item img {
                width: 40px;
                height: auto;
            }

            .highlight {
                color: #fff;
                font-weight: bold;
            }

            /* Custom Scrollbar */
            .main-content::-webkit-scrollbar { width: 8px; }
            .main-content::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
            .main-content::-webkit-scrollbar-thumb { 
                background: #c5a059; 
                border-radius: 10px;
            }
        </style>

        <div class="help-container">
            <navbar-component id="nav"></navbar-component>
            
            <div class="main-content">
                <h1>Manuel du Jeune Sorcier</h1>

                <section class="scroll-section">
                    <h2>Règles du Duel (Khet 2.0)</h2>
                    <p>Le duel se déroule sur une grille de <span class="highlight">10x10</span>. Le but est simple : utiliser votre laser pour détruire le Pharaon adverse.</p>
                    
                    <div class="rules-grid">
                        <div>
                            <h3>Les Pièces</h3>
                            <div class="piece-card">
                                <span class="piece-name">Sphinx</span>
                                Indestructible. Tire un laser à la fin de votre tour.
                            </div>
                            <div class="piece-card">
                                <span class="piece-name">Pharaon</span>
                                La pièce maîtresse. Vulnérable sur 4 côtés. Sa perte signifie la fin du duel.
                            </div>
                            <div class="piece-card">
                                <span class="piece-name">Pyramides</span>
                                Possèdent un miroir diagonal. Peuvent rediriger le laser ou être détruites si frappées sur une face vulnérable.
                            </div>
                            <div class="piece-card">
                                <span class="piece-name">Scarabée</span>
                                Indestructible car il possède des miroirs sur les deux faces. Peut échanger sa place avec le Sphinx ou le Pharaon.
                            </div>
                        </div>

                        <div>
                            <h3>Actions autorisées</h3>
                            <p>À chaque tour, vous devez choisir <span class="highlight">une seule</span> action :</p>
                            <ul>
                                <li>Rotation de 90° d'une pièce.</li>
                                <li>Déplacement orthogonal d'une case.</li>
                                <li>Placer une Pyramide depuis votre réserve (7 max).</li>
                                <li>Échanger la position du Scarabée (Cooldown de 4 tours).</li>
                            </ul>
                            <p><i>Note : Le Sphinx et le Pharaon ne peuvent pas se déplacer !</i></p>
                        </div>
                    </div>
                </section>

                <section class="scroll-section">
                    <h2>Le Système de Ligues de Poudlard</h2>
                    <p>Progressez à travers les années pour devenir un Grand Sorcier. Chaque victoire vous rapporte des Vifs d'Or (ELO).</p>
                    
                    <div class="ranked-list">
                        <div class="league-item">
                            <img src="/assets/webp/annee1.webp">
                            <span><span class="highlight">1ère année :</span> Apprenti (0 - 1000 ELO)</span>
                        </div>
                        <div class="league-item">
                            <img src="/assets/webp/annee2.webp">
                            <span><span class="highlight">2ème année :</span> Initié (1000 - 2000 ELO)</span>
                        </div>
                        <div class="league-item">
                            <img src="/assets/webp/annee3.webp">
                            <span><span class="highlight">3ème année :</span> Pratiquant (2000 - 3000 ELO)</span>
                        </div>
                        <div class="league-item">
                            <img src="/assets/webp/annee4.webp">
                            <span><span class="highlight">4ème année :</span> Expert (3000 - 4000 ELO)</span>
                        </div>
                        <div class="league-item">
                            <img src="/assets/webp/annee5.webp">
                            <span><span class="highlight">5ème année :</span> Maître (4000 - 5000 ELO)</span>
                        </div>
                        <div class="league-item">
                            <img src="/assets/webp/annee6.webp">
                            <span><span class="highlight">6ème année :</span> Grand Maître (5000 - 6000 ELO)</span>
                        </div>
                        <div class="league-item">
                            <img src="/assets/webp/annee7.webp">
                            <span><span class="highlight">7ème année :</span> Sorcier Suprême (6000+ ELO)</span>
                        </div>
                    </div>
                    <p style="margin-top: 20px; font-style: italic;">Il faut accumuler <span class="highlight">1000 ELO</span> pour passer à l'année suivante.</p>
                </section>
            </div>
        </div>
        `;
    }
}

customElements.define('help-page', HelpPage);