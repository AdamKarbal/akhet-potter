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
                height: 95vh;
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
            
            #social-btn > img, #help > img, #play-btn > img, #request-btn > img{
                width: 90%;
                height: auto;
                padding-left: 4px;
                padding-right: 4px;
            }
            
            #social-btn{
            width: fit-content;
            }
            
            
            #request-btn{
            width: fit-content;
            }
            
            #help{
                width: 55px;
                margin-top: 8rem;
            }
            
            #help > img{
                width: 90%;
                height: auto;
                padding-left: 4px;
                padding-right: 4px;
            }
            
            #logout-btn{
                width: 55px;
            }
            
            #logout-btn > img{
                width: 90%;
                height: auto;
                padding-left: 4px;
                padding-right: 4px;
            }
            .navElem, #play-btn, #social-btn, #request-btn, #help, #logout-btn {
                cursor: pointer;
                transition: all 0.3s ease;
                border-radius: 8px; 
                padding: 2px; 
            }

            .navElem:hover, #play-btn:hover, #social-btn:hover, #request-btn:hover, #help:hover, #logout-btn:hover {
                transform: scale(1.15);
                background-color: rgba(212, 175, 55, 0.2); 
                box-shadow: 0 0 12px rgba(212, 175, 55, 0.6); 
            }
            
            .navElem:active, #play-btn:active, #social-btn:active, #request-btn:active, #help:active, #logout-btn:active {
                transform: scale(0.95);
            }
            
        </style>
        
        <div class="navbar">
            <div id="play-btn"><img src="assets/jouer.png"></div>
            <div class="navElem" id="btn-globalchat"><img src="assets/globalchat.png" title="Chat Global"></div>
            <div id="social-btn"><img src="assets/social.png"></div>
            <div class="navElem"><img src="assets/reglages.png"></div>
            <div id="request-btn"><img src="assets/request.png"></div>
            <div id="help"><img src="assets/aide.png"></div>
            <div id="logout-btn"><img src="assets/logout.png"></div>
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
              const socialBtn = document.getElementById('social-btn');
        socialBtn.addEventListener('click', () => {
            window.location.hash = 'SOC';
        });

        const requBtn = document.getElementById('request-btn');
        requBtn.addEventListener('click', () => {
            window.location.hash = 'REQ';
        });

        const playBtn = document.getElementById("play-btn")
        playBtn.addEventListener('click', () => {
            window.location.hash = '';
        });

        const logoutBtn = document.getElementById('logout-btn');

        logoutBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            try{
                const response = await fetch("/api/logout", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if(response.ok){
                    window.location.hash = 'LGN';
                    localStorage.clear();
                    window.location.reload();
                }
            }
            catch(error){
                console.log("Erreur lors de la déconnexion: " , error);
            }
        })
    }
}

customElements.define('navbar-component',NavbarComponent);