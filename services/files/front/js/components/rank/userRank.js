export class PlayerRank extends HTMLElement {
    constructor() {
        super();
        this.RANK_MAPPER = {
            "1ère année" : 'assets/webp/annee1.webp',
            "2ème année" : 'assets/webp/annee2.webp',
            "3ème année" : 'assets/webp/annee3.webp',
            "4ème année" : 'assets/webp/annee4.webp',
            "5ème année" : 'assets/webp/annee5.webp',
            "6ème année" : 'assets/webp/annee6.webp',
            "7ème année" : 'assets/webp/annee7.webp'
        };
    }

    async connectedCallback() {
        const htmlUrl = new URL('./userRank.html', import.meta.url);
        const cssUrl = new URL('./userRank.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
<!--            <style>-->
<!--                .rankContainer {-->
<!--                    display: flex;-->
<!--                    flex-direction: row;-->
<!--                    align-items: center;-->
<!--                    gap: 0.75vh;-->
<!--                }-->
<!--                -->
<!--                .userRank, .userElo {-->
<!--                    display: flex;-->
<!--                    flex-direction: row;-->
<!--                    align-items: center;-->
<!--                    gap: 0.7vw;-->
<!--                    font-family: "Agency FB";-->
<!--                    color: #c5a059;-->
<!--                    font-size: 1.45em;-->
<!--                    background: linear-gradient(-->
<!--                            to bottom,-->
<!--                            #FFF8DC 0%,-->
<!--                            #FFD700 50%,-->
<!--                            #8B4513 100%-->
<!--                    );-->
<!--                    -webkit-background-clip: text;-->
<!--                    background-clip: text;-->
<!--                    color: transparent;-->
<!--                    filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));-->
<!--                }-->
<!--                -->
<!--                #userRankImg {-->
<!--                    width: 60px;-->
<!--                    height: auto;-->
<!--                }-->
<!--                #userVOImg {-->
<!--                    margin-left: 1.5vw;-->
<!--                    width: 40px;-->
<!--                    height: auto;-->
<!--                }-->
<!--                -->
<!--            </style>-->
<!--            <div class="rankContainer">-->
<!--                <div class="userRank">-->
<!--                    <img id="userRankImg" src='assets/annee5.png'>-->
<!--                    3ème année-->
<!--                </div>-->
<!--                <div class="userElo">-->
<!--                    <img id="userVOImg" src='assets/vifdor.png'>-->
<!--                    1123 Vifs d'Or -->
<!--                </div>-->
<!--            </div>-->
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;
    }

    setPlayerInfo(data) {
        const trySetInfo = () => {
            const userRankDiv = this.querySelector('.userRank');
            const userEloDiv = this.querySelector('.userElo');
            if (userRankDiv && userEloDiv) {
                if (data.rank) {
                    const imagePath = this.RANK_MAPPER[data.rank] || 'assets/webp/annee2.webp';
                    userRankDiv.innerHTML = `
                        <img id="userRankImg" src="${imagePath}" alt="${data.rank}">
                        ${data.rank}
                    `;
                }
                if (data.elo !== undefined) {
                    userEloDiv.innerHTML = `
                        <img id="userVOImg" src="assets/vifdor.png" alt="Vif d'Or"> 
                        ${data.elo} Vifs d'Or
                    `;
                }
            } else {
                setTimeout(trySetInfo, 50);
            }
        };

        trySetInfo();
    }
}

customElements.define('player-rank', PlayerRank);