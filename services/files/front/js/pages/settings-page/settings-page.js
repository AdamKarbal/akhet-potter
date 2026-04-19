export class SettingsPage extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./settings-page.html', import.meta.url);
        const cssUrl = new URL('./settings-page.css', import.meta.url);
        
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
            console.error("Failed to load settings page resources:", error);
        }
    }
}

customElements.define('settings-page', SettingsPage);