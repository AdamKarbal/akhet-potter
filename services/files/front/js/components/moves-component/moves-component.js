export class MovesComponent extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        this.innerHTML = `
        <style>
            img{
                width: 30%;
            }
            
            .movesbox{
                padding : 10px;
                border : 2px double #c5a059;
                border-radius : 5px;
                background-color: rgba(20, 15, 10, 0.55);
                box-shadow: 0 0 15px #d4af37, inset 0 0 20px rgba(212, 175, 55, 0.3);
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 200px;
            }
            .title{
                font-family: HarryPotter;
                color: #c5a059;
                font-size: 1.5em;
                background: linear-gradient(
                    to bottom, 
                    #FFF8DC 0%, 
                    #FFD700 50%, 
                    #8B4513 100%
                );
                -webkit-background-clip: text;
                background-clip: text;               
                color: transparent;
                filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
            }
            
            .back-and-forth {
                display: flex;
                flex-direction: row;
                gap: 15px; /* Espace entre les boutons */
            }
            
            .arrow {
                background: linear-gradient(to bottom, #4a3b2a, #2b1d0e);
                color: #c5a059;
                border: 1px solid #c5a059;
                padding: 5px 15px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: bold;
                box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                user-select: none;
            }

            .arrow:hover {
                background: linear-gradient(to bottom, #c5a059, #8b6c42);
                color: #1a110a;
                box-shadow: 0 0 10px #c5a059;
            }

            .arrow:active {
                transform: translateY(2px);
            }
            
            #movesContent{
                padding : 10px;
                margin-top : 1vh;
                border : 0px solid transparent;
                border-radius : 5px;
                background-color: rgba(20, 15, 10, 0.55);
                flex-direction: column;
                align-items: center;
                width : 90%;
                color: white;
                font-family: "Agency FB";
                margin-bottom: 2vh;
            }
        </style>
        
        <div class="movesbox">
            <img src="assets/coups.png">
            <div id="movesContent"> e2 - e3 </div>
            <div class="back-and-forth">
                <div class="arrow"><</div>
                <div class="arrow">></div>
            </div>
        </div>
        `;
    }
}

customElements.define('moves-component',MovesComponent);