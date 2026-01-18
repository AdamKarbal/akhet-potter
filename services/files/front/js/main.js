

import { Renderer } from './game/Renderer.js';
import { GameBoard } from './components/GameBoard/GameBoard.js'
import {GameEngine} from "./game/GameEngine.js";
import { InputHandler } from "./game/InputManager.js";

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