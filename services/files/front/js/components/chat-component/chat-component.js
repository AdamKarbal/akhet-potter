export class ChatComponent extends HTMLElement{
    constructor(){
        super();
    }

    connectedCallback(){
        this.innerHTML = `
        <style>    
            .chatbox{
                padding : 10px;
                border : 2px double #c5a059;
                border-radius : 5px;
                background-color: rgba(20, 15, 10, 0.55);
                box-shadow: 0 0 15px #d4af37, inset 0 0 20px rgba(212, 175, 55, 0.3);
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 200px;
            }
            
            #chatIcon{
                width : 12.5%;
            }
            
            #chatContent{
                padding : 10px;
                margin-top : 1vh;
                border : 0px solid transparent;
                border-radius : 5px;
                background-color: rgba(20, 15, 10, 0.55);
                flex-direction: column;
                align-items: center;
                width : 90%;
                color: white;
                font-family: "Agency FB";
            }
        </style>
        
        <div class="chatbox">
            <img id="chatIcon" src="assets/chat.png">
            <div id="chatContent">guest145245: Ceci est le chat!</div>
        </div>
        `;
    }
}

customElements.define('chat-component',ChatComponent);