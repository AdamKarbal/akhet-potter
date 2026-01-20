import '../../components/player-layout/player-layout.js'
import '../../components/moves-component/moves-component.js'
import '../../components/chat-component/chat-component.js'
import '../../components/navbar-component/navbar-component.js'
import '../../components/GameBoard/GameBoard.js'

export class MatchComponent extends HTMLElement{
    constructor() {
        super();
    }

    connectedCallback() {
        // language=HTML
        this.innerHTML = `
            <style>
                body{
                    background-image: url("../../../assets/background1v1.png");
                    background-size: 100% 100%;
                    background-repeat: no-repeat;
                    min-height: 100vh;
                    margin: 0;
                }
                
                .container{
                    display: grid;
                    grid-template-columns: 10% auto 25%;
                    grid-template-rows: 15% 70% 15%;
                }
                
                #nav {
                    grid-row: 1/4;
                    grid-column: 1;
                }

                #pl2{
                    grid-column: 2;
                    grid-row: 3;
                }
                
                #pl1{
                    grid-column: 2;
                    grid-row: 1;
                }
                
                #right-aside{
                    grid-column: 3;
                    grid-row: 2;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin : 1rem;
                }
                
                .board{
                    border : 2px double #c5a059;
                    border-radius: 15px;
                    grid-column: 2;
                    grid-row: 2;
                    background-color: rgba(20, 15, 10, 0.55);
                    box-shadow: 0 0 15px #d4af37, inset 0 0 20px rgba(212, 175, 55, 0.3);
                    margin: 5vh;
                    display: inline-block;
                    padding: 5px;
                }
                
                .board-container {
                    grid-column: 2;
                    grid-row: 2;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                }
                
                
            </style>
        <div class="container">
            <navbar-component id="nav"></navbar-component>
            <div class="board-container">
                <div class="board">
                    <game-board></game-board>
                </div>
            </div>            
            <div id="right-aside">
                <chat-component></chat-component>
                <moves-component></moves-component>
            </div>
            <player-layout id="pl1"></player-layout>
            <player-layout id="pl2"></player-layout>
        </div>
    `;
    }
}

customElements.define('match-page', MatchComponent);