import {Timer} from "../timer/timer.js";
import {PlayerInfo} from "../userInfo/userInfo.js";
import {PlayerRank} from "../rank/userRank.js";
import {AiInfo} from "../aiInfo/aiInfo.js";

export class AiLayout extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback(){
        // language=HTML
        this.innerHTML = `
            <style>
                .layout{
                    display: flex;
                    flex-direction: row;
                    gap: 1rem;
                    justify-content: center;
                    align-items: center;
                    margin-top: 2vh;
                    height: 75%;
                }
            </style>
        <div class="layout">
            <div class="userinfo"><ai-info></ai-info></div>
        </div>
    `;
    }
}

customElements.define('ai-layout', AiLayout);
