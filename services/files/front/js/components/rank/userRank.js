export class PlayerRank extends HTMLElement {

    constructor(){
        super();
    }

    connectedCallback(){
        // language=HTML
        this.innerHTML = `
            <div class="rankContainer">
                <div class="userRank">
                    <img class="userRankImg" src='${this.src}' alt='${this.alt}'>
                    3ème année
                </div>
                <div class="userVO">
                    <img class="userRankImg" src='${this.src}' alt='${this.alt}'>
                    1123 Vifs d'Or 
                </div>
            </div>
        `;
    }
}

customElements.define('player-rank', PlayerRank);

