

import { Renderer } from './game/Renderer.js';
import { GameBoard } from './components/GameBoard/GameBoard.js'

window.addEventListener('load', async () => {
    console.log("Démarrage de l'application...");
    const boardComponent = document.getElementById('akhet-board');
    const renderer = new Renderer(boardComponent);
    await renderer.init();
    console.log("Plateau initialisé avec succès !");
});