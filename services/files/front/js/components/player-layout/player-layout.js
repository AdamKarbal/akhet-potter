import {Timer} from "../timer/timer.js";

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
                    margin-top: 5vh;
                }
            </style>
        <div class="layout">
            <div class="timer"><player-timer></player-timer></div>
            <div class="userinfo"></div>
            <div class="rank"></div>
        </div>
    `;
    }
}

customElements.define('player-layout', PlayerLayout);
