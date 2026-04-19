export class HelpPage extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./help-page.html', import.meta.url);
        const cssUrl = new URL('./help-page.css', import.meta.url);
        
        try {
            const [htmlResponse] = await Promise.all([
                fetch(htmlUrl)
            ]);

            const html = await htmlResponse.text();

            this.innerHTML = `
                <link rel="stylesheet" href="${cssUrl.href}">
                ${html}
            `;
        } catch (error) {
            console.error("Failed to load help page resources:", error);
        }
    }
}

customElements.define('help-page', HelpPage);