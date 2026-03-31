
export class QuitComponent extends HTMLElement {
    constructor(){
        super();
    }

    connectedCallback() {
        this.innerHTML = `
        <style>
        .quit-container {
            display: flex;
            justify-content: center;
        }
        
        button {
            padding: 0;
            border: none;
            background: none;   
            cursor: pointer;
            outline: none;
        }
        
        button > img {
            height: auto;
            width: 125px;
            filter: sepia(0.8) hue-rotate(-50deg) saturate(2.25);
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);        
        }
                button:hover > img {
            filter: sepia(0.3) hue-rotate(-50deg) saturate(3) drop-shadow(0 0 12px rgba(255, 50, 50, 0.6));
            transform: scale(1.1) rotate(-3deg);
        }
        
        button:active > img {
            transform: scale(0.9); 
            filter: sepia(0.8) hue-rotate(-50deg) saturate(2) brightness(0.8);
        }
        </style>
        
       <div class="quit-container">
        <button id="leave-btn" title="Quitter la partie">
            <img src="assets/quitgame.png" alt="Quitter">
        </button>
       </div> 
    `;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const leavebtn = this.querySelector("#leave-btn");

        leavebtn.addEventListener('click', () => {
            window.location.hash = '';
    })
    }

}

customElements.define('quit-component', QuitComponent);