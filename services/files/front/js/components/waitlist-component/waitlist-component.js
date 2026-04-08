export class WaitlistComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    async connectedCallback(){
        const [html, css] = await Promise.all([
            fetch('./js/components/waitlist-component/waitlist-component.html').then(res => res.text()),
            fetch('./js/components/waitlist-component/waitlist-component.css').then(res => res.text())
        ]);

        const template = document.createElement('template');
        template.innerHTML = `
            <style>${css}</style>
            ${html}
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.init();
    }

    init(){
        const cancelBtn = this.shadowRoot.querySelector('button');
        cancelBtn.onclick = () => {
            this.dispatchEvent(new CustomEvent('cancel-search', {
                bubbles: true,
                composed: true
            }));
            this.remove();
        };
    }
}
customElements.define('waitlist-component', WaitlistComponent);