export class PlayerInfo extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./userInfo.html', import.meta.url);
        const cssUrl = new URL('./userInfo.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;
    }

    setPlayerInfo(data) {
        const trySetInfo = () => {
            const nameContainer = this.querySelector('.userName');

            if (nameContainer) {
                nameContainer.innerHTML = data.username || "Joueur Inconnu";
            } else {
                setTimeout(trySetInfo, 50);
            }
        };

        trySetInfo();
    }
}

customElements.define('player-info', PlayerInfo);