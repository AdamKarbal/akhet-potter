
export class QuitComponent extends HTMLElement {
    constructor(){
        super();
    }

    connectedCallback() {
        this.innerHTML = `
        <style>
        .quit-container {
            
        }
        button{
            padding: 0;
            border: none;
            background: none;   
            cursor: pointer;
        }
        
        button > img {
            height: auto;
            width: 125px;
            filter: sepia(0.8) hue-rotate(-50deg) saturate(2.25);        
        }
        
        .button:hover > img {
            filter: sepia(0.3) hue-rotate(-50deg) saturate(3);
        }
        </style>
        
       <div class="quit-container">
        <button>
            <img src="assets/quitgame.png">
        </button>
        </div> 
    `
    }
}

customElements.define('quit-component', QuitComponent);