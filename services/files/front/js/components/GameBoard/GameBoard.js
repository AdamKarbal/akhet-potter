export class GameBoard extends HTMLElement {
    constructor(){
        super();
        this.attachShadow({mode: 'open'});
    }

    async connectedCallback(){
        const htmlUrl = new URL('./GameBoard.html', import.meta.url);
        const htmlResponse = await fetch(htmlUrl);
        const htmlContent = await htmlResponse.text();
        this.shadowRoot.innerHTML = htmlContent;
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', new URL('./GameBoard.css', import.meta.url));
        this.shadowRoot.appendChild(linkElem);
        console.log("Gameboard chargé (GameBoard.js)")
    }

    getContexts(){
        if (!this.shadowRoot.getElementById('layer-board')) return null; // ici c'est au cas ou le html n'est pas encore injecté
        return {
            board: this.shadowRoot.getElementById('layer-board').getContext('2d'),
            pieces: this.shadowRoot.getElementById('layer-pieces').getContext('2d'),
            vfx: this.shadowRoot.getElementById('layer-vfx').getContext('2d'),
            vfxCanvas: this.shadowRoot.getElementById('layer-vfx')
        };
    }
}
customElements.define('game-board', GameBoard);