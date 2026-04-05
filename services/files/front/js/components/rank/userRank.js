export class PlayerRank extends HTMLElement {
    constructor() {
        super();
        this.RANK_MAPPER = {
            "1ère année" : 'assets/annee1.png',
            "2ème année" : 'assets/annee2.png',
            "3ème année" : 'assets/annee3.png',
            "4ème année" : 'assets/annee4.png',
            "5ème année" : 'assets/annee5.png',
            "6ème année" : 'assets/annee6.png',
            "7ème année" : 'assets/annee7.png'
        };
    }

    async connectedCallback() {
        const htmlUrl = new URL('./userRank.html', import.meta.url);
        const cssUrl = new URL('./userRank.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
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
                    const imagePath = this.RANK_MAPPER[data.rank] || 'assets/annee2.png';
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