export class GameLoaderComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.timer = null;
    }

    async connectedCallback() {
        const htmlUrl = new URL('./gameloader-component.html', import.meta.url);
        const cssUrl = new URL('./gameloader-component.css', import.meta.url);

        const [html, css] = await Promise.all([
            fetch(htmlUrl).then(res => res.text()),
            fetch(cssUrl).then(res => res.text())
        ]);

        const template = document.createElement('template');
        template.innerHTML = `
            <style>${css}</style>
            ${html}
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.startCountdown();
    }

    disconnectedCallback() {
        if (this.timer) clearTimeout(this.timer);
    }

    startCountdown() {
        this.timer = setTimeout(() => {
            this.dispatchEvent(new CustomEvent('loader-finished', {
                bubbles: true,
                composed: true
            }));

            this.remove();
        }, 5000);
    }
}

customElements.define('game-loader', GameLoaderComponent);
