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
                        <span class="rank-text">${data.rank}</span>
                    `;
                }
                if (data.elo !== undefined) {
                    userEloDiv.innerHTML = `
                        <span class="elo-number">${data.elo}</span>
                        <img id="userVOImg" src="assets/vifdor-1.webp" alt="Vif d'Or">
                        <span class="elo-text">Vifs d'Or</span>
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