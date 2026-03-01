import {Timer} from "../timer/timer.js";
import {PlayerInfo} from "../userInfo/userInfo.js";
import {PlayerRank} from "../rank/userRank.js";

export class PlayerLayout extends HTMLElement {
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
                    height: 75%;
                }
            </style>
        <div class="layout">
            <div class="timer"><player-timer></player-timer></div>
            <div class="userinfo"><player-info></player-info></div>
            <div class="rank"><player-rank></player-rank></div>
        </div>
    `;
    }

    setPlayerInfo(data){
        const playerInfo = this.querySelector('player-info');
        const playerRank = this.querySelector('player-rank');
        if (playerInfo) {
            customElements.whenDefined('player-info').then(() => {
                playerInfo.setPlayerInfo(data);
            });
        }

        if (playerRank) {
            customElements.whenDefined('player-rank').then(() => {
                playerRank.setPlayerInfo(data);
            });
        }
    }
}

customElements.define('player-layout', PlayerLayout);
