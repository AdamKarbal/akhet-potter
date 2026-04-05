import {Timer} from "../timer/timer.js";
import {PlayerInfo} from "../userInfo/userInfo.js";
import {PlayerRank} from "../rank/userRank.js";
import {PlayerInventory} from "../player-inventory/player-inventory.js";

export class PlayerLayout extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./player-layout.html', import.meta.url);
        const cssUrl = new URL('./player-layout.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;
    }

    setPlayerInfo(data) {
        const trySetInfo = () => {
            const playerInfo = this.querySelector('player-info');
            const playerRank = this.querySelector('player-rank');

            if (playerInfo && playerRank) {
                customElements.whenDefined('player-info').then(() => {
                    if (typeof playerInfo.setPlayerInfo === 'function') {
                        playerInfo.setPlayerInfo(data);
                    }
                });

                customElements.whenDefined('player-rank').then(() => {
                    if (typeof playerRank.setPlayerInfo === 'function') {
                        playerRank.setPlayerInfo(data);
                    }
                });
            } else {
                setTimeout(trySetInfo, 50);
            }
        };

        trySetInfo();
    }
}

customElements.define('player-layout', PlayerLayout);