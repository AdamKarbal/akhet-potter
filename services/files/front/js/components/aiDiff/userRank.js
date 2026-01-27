export class aiDiff extends HTMLElement {

    constructor(){
        super();
    }

    connectedCallback(){
        // language=HTML
        this.innerHTML = `
            <style>
                .rankContainer {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 0.75vh;
                }
                
                .userRank {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 1vw;
                    font-family: HarryPotter;
                    color: #c5a059;
                    font-size: 1.2em;
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
                
                #userRankImg {
                    width: 60px;
                    height: auto;
                }
                #userVOImg {
                    margin-left: 1.5vw;
                    width: 40px;
                    height: auto;
                }
                
            </style>
            <div class="rankContainer">
                <div class="userRank">
                    <img id="userRankImg" src=''>
                    <span id="diffText">Difficile</span>
                </div>
                <div class="userRank">
                    <img id="userVOImg" src='assets/vifdor.png'>
                    1123 Vifs d'Or 
                </div>
            </div>
        `;
    }
}

customElements.define('ai-diff', aiDiff);

