export class aiDiff extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./userRank.html', import.meta.url);
        const cssUrl = new URL('./userRank.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;
    }
}

customElements.define('ai-diff', aiDiff);