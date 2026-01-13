export class PlayerInfo extends HTMLElement {

    constructor(){
        super();
    }

    connectedCallback(){
        // language=HTML
        this.innerHTML = `
        <div class="userImg"> </div>
        <div class="userName">Guest122459978</div>
    `;
    }
}

customElements.define('player-info', PlayerInfo);

