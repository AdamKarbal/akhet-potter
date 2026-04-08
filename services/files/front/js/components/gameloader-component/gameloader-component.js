export class GameLoaderComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.timer = null;
    }

    async connectedCallback() {
        const [html, css] = await Promise.all([
            fetch('./js/components/gameloader-component/gameloader-component.html').then(res => res.text()),
            fetch('./js/components/gameloader-component/gameloader-component.css').then(res => res.text())
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