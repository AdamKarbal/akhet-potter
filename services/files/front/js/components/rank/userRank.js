export class PlayerRank extends HTMLElement {

    constructor(){
        super();
    }

    RANK_MAPPER = {
        "1ère année" : 'assets/annee1.png',
        "2ème année" : 'assets/annee2.png',
        "3ème année" : 'assets/annee3.png',
        "4ème année" : 'assets/annee4.png',
        "5ème année" : 'assets/annee5.png',
        "6ème année" : 'assets/annee6.png',
        "7ème année" : 'assets/annee7.png'
    };

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
                
                .userRank, .userElo {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 0.7vw;
                    font-family: "Agency FB";
                    color: #c5a059;
                    font-size: 1.45em;
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
                    <img id="userRankImg" src='assets/annee5.png'>
                    3ème année
                </div>
                <div class="userElo">
                    <img id="userVOImg" src='assets/vifdor.png'>
                    1123 Vifs d'Or 
                </div>
            </div>
        `;
    }

    setPlayerInfo(data) {
        const rankImg = this.querySelector('#userRankImg');
        const userRankDiv = this.querySelector('.userRank');
        const userEloDiv = this.querySelector('.userElo');

        if (userRankDiv && data.rank) {
            const imagePath = this.RANK_MAPPER[data.rank] || 'assets/annee2.png';

            userRankDiv.innerHTML = `
            <img id="userRankImg" src="${imagePath}">
            ${data.rank}
        `;
        }

        if (userEloDiv && data.elo !== undefined) {
            userEloDiv.innerHTML = `
            <img id="userVOImg" src="assets/vifdor.png"> 
            ${data.elo} Vifs d'Or
        `;
        }
    }
}

customElements.define('player-rank', PlayerRank);

