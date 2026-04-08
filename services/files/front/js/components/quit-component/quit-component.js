export class QuitComponent extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./quit-component.html', import.meta.url);
        const cssUrl = new URL('./quit-component.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;

        this.setupEventListeners();
    }

    // FIXME: faire les modifs dans le html
    //
    //     <style>
    //     .quit-container {
    //         display: flex;
    //         justify-content: center;
    //     }
    //
    //     button {
    //         padding: 0;
    //         border: none;
    //         background: none;
    //         cursor: pointer;
    //         outline: none;
    //     }
    //
    //     button > img {
    //         height: auto;
    //         width: 125px;
    //         filter: sepia(0.8) hue-rotate(-50deg) saturate(2.25);
    //         transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    //     }
    //             button:hover > img {
    //         filter: sepia(0.3) hue-rotate(-50deg) saturate(3) drop-shadow(0 0 12px rgba(255, 50, 50, 0.6));
    //         transform: scale(1.1) rotate(-3deg);
    //     }
    //
    //     button:active > img {
    //         transform: scale(0.9);
    //         filter: sepia(0.8) hue-rotate(-50deg) saturate(2) brightness(0.8);
    //     }
    //     </style>
    //
    //    <div class="quit-container">
    //     <button id="btn">
    //         <img src="assets/quitgame.png">
    //     </button>
    //     </div>

    setupEventListeners() {
        const leavebtn = this.querySelector("#leave-btn");

        if (leavebtn) {
            leavebtn.addEventListener('click', () => {
                window.location.hash = '';
            });
        }
    }
}

customElements.define('quit-component', QuitComponent);