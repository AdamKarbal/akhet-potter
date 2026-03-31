export class AiInfo extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./aiInfo.html', import.meta.url);
        const cssUrl = new URL('./aiInfo.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;
    }

    setPlayerInfo(data) {
        const trySetInfo = () => {
            const nameContainer = this.querySelector('.userName');
            if (nameContainer) {
                const name = data?.username || 'Dumbeldore (AI)';
                nameContainer.textContent = name;
            } else {
                setTimeout(trySetInfo, 50);
            }
        };

        trySetInfo();
    }
}

customElements.define('ai-info', AiInfo);