

import { Renderer } from './game/Renderer.js';
import { GameBoard } from './components/GameBoard/GameBoard.js'
import {GameEngine} from "./game/GameEngine.js";
import { InputHandler } from "./game/InputManager.js";
import './pages/match-page/match-page.js';


window.addEventListener('load', async () => {
    console.log("Démarrage de l'application...");
    const boardComponent = document.getElementById('akhet-board');
    const gameEngine = new GameEngine();
    const renderer = new Renderer(boardComponent);
    await renderer.init(gameEngine);
    const inputHandler = new InputHandler(boardComponent, renderer, gameEngine);
    inputHandler.init();
    console.log("Plateau initialisé avec succès !");
});

function updateView() {
    const app = document.getElementById('app');
    const hash = window.location.hash;

    if (hash === '#game') {
        console.log("Mode Jeu activé");
        app.innerHTML = '<match-page></match-page>';
    } else {
        console.log("Accueil");
        // language=HTML
        app.innerHTML = `
            <div class="homescreen">
                <h1>Bienvenue sur Akhet Potter</h1>
                <button id="btn-start">Jouer</button>
            </div>
        `;

        document.getElementById('btn-start').addEventListener('click', () => {
            window.location.hash = 'game';
        });
    }
}

window.addEventListener('load', updateView);
window.addEventListener('hashchange', updateView);

