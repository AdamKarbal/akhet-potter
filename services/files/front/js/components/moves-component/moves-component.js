export class MovesComponent extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./moves-component.html', import.meta.url);
        const cssUrl = new URL('./moves-component.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();
        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;
    }
}

customElements.define('moves-component', MovesComponent);