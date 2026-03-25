import '../global-chat-component/global-chat-component.js'

export class NavbarComponent extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        this.innerHTML = `
        <style>    
            .navbar{
                display: flex;
                flex-direction: column;
                gap : 1rem;
                width: 55px;
                border: 2px double #c5a059;
                border-radius: 10px;
                margin: 0.5rem;
                background-color: rgba(20, 15, 10, 0.55);
                box-shadow: 0 0 15px #d4af37, inset 0 0 20px rgba(212, 175, 55, 0.3);
            }
            
            .navElem > img{
                width: 90%;
                height: auto;
                padding-left: 4px;
                padding-right: 4px;
            }
            
            .navElem {
                width: fit-content;
            }
            
            #help{
                width: 55px;
                margin-top: 17rem;
            }
            
            #help > img{
                width: 90%;
                height: auto;
                padding-left: 4px;
                padding-right: 4px;
            }
            
        </style>
        
        <div class="navbar">
            <div class="navElem"><img src="assets/jouer.png" title="Jouer"></div>
            <div class="navElem" id="btn-globalchat"><img src="assets/globalchat.png" title="Chat Global"></div>
            <div class="navElem"><img src="assets/social.png" title="Amis"></div>
            <div class="navElem"><img src="assets/reglages.png" title="Réglages"></div>
            <div class="navElem">...</div>
            <div id="help"><img src="assets/aide.png"></div>
        </div>

        <global-chat id="my-global-chat"></global-chat>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const btnChat = this.querySelector('#btn-globalchat');
        const globalChatModal = this.querySelector('#my-global-chat');
        btnChat.onclick = () => {
            globalChatModal.toggle();
        };
    }
}

customElements.define('navbar-component',NavbarComponent);