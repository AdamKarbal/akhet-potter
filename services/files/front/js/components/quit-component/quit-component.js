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