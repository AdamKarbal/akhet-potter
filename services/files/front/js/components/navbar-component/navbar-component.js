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
            
            #social-btn > img{
                width: 90%;
                height: auto;
                padding-left: 4px;
                padding-right: 4px;
            }
            
            #social-btn{
            width: fit-content;
            }
            
            #request-btn > img{
                width: 90%;
                height: auto;
                padding-left: 4px;
                padding-right: 4px;
            }
            
            #request-btn{
            width: fit-content;
            }
            
            #help{
                width: 55px;
                margin-top: 12rem;
            }
            
            #help > img{
                width: 90%;
                height: auto;
                padding-left: 4px;
                padding-right: 4px;
            }
            
            
        </style>
        
        <div class="navbar">
            <div class="navElem"><img src="assets/jouer.png"></div>
            <div class="navElem"><img src="assets/globalchat.png"></div>
            <div id="social-btn"><img src="assets/social.png"></div>
            <div class="navElem"><img src="assets/reglages.png"></div>
            <div id="request-btn"><img src="assets/request.png"></div>
            <div id="help"><img src="assets/aide.png"></div>
        </div>
        `;

        const socialBtn = document.getElementById('social-btn');
        socialBtn.addEventListener('click', () => {
            window.location.hash = 'SOC';
        });

        const requBtn = document.getElementById('request-btn');
        requBtn.addEventListener('click', () => {
            window.location.hash = 'REQ';
        });
    }
}

customElements.define('navbar-component',NavbarComponent);