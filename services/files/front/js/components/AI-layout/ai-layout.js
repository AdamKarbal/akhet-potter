import {Timer} from "../timer/timer.js";
import {PlayerInfo} from "../userInfo/userInfo.js";
import {PlayerRank} from "../rank/userRank.js";
import {AiInfo} from "../aiInfo/aiInfo.js";

export class AiLayout extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./ai-layout.html', import.meta.url);
        const cssUrl = new URL('./ai-layout.css', import.meta.url); // NOUVEAU
        const response = await fetch(htmlUrl);
        const html = await response.text();
        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;
    }

    setPlayerInfo(data) {
        const trySetInfo = () => {
            const aiInfo = this.querySelector('ai-info');
            if (aiInfo && typeof aiInfo.setPlayerInfo === 'function') {
                aiInfo.setPlayerInfo(data);
            } else {
                setTimeout(trySetInfo, 50);
            }
        };

        trySetInfo();
    }
}

customElements.define('ai-layout', AiLayout);
