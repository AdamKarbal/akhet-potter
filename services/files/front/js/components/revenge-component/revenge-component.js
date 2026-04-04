import {socket} from '../../socket.js'

export class RevengeComponent extends HTMLElement{
    _winner;
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this._winner=null;
        this.socket = socket;
        this.acceptedRevenge = false;
    }

    async connectedCallback(){
        const [html, css] = await Promise.all([
            fetch('./js/components/revenge-component/revenge-component.html').then(res => res.text()),
            fetch('./js/components/revenge-component/revenge-component.css').then(res => res.text())
        ]);

        const template = document.createElement('template');
        template.innerHTML = `
            <style>${css}</style>
            ${html}
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));
        const leaveBtn = this.shadowRoot.querySelector('#leave-btn');
        const revengeBtn = this.shadowRoot.querySelector('#revenge-btn');

        revengeBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('revenge', {
                bubbles: true,
                composed: true
            }));
            this.acceptedRevenge = true;

            revengeBtn.innerText = "En attente...";
            revengeBtn.disabled = true;
            revengeBtn.style.cursor = 'wait';
            if(leaveBtn) leaveBtn.style.display = 'none';
        });

        leaveBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('leave', {
                bubbles: true,
                composed: true
            }));
            this.remove();
            window.location.hash = '';
        });

        this.socket.on("revenge-request", (counter) => {
            const reqCounter = this.shadowRoot.querySelector("#revenge-req-counter");
            if(counter === 1) reqCounter.innerText = "Demandes : ✔️ | ⌛";
            else if(counter === 2) reqCounter.innerText = "Demandes : ✔️ | ✔️";
        });


        this.socket.on("back-to-homepage", () => {
            if(this.acceptedRevenge){
                leaveBtn.style.display = 'block';
                leaveBtn.innerText = "RETOUR ACCUEIL";
                this.shadowRoot.querySelector("#revenge-btn").remove();
                this.shadowRoot.querySelector(".progress-wrapper").remove();
                this.shadowRoot.querySelector("#message").innerText = "L'adversaire a rejetté la demande de revanche. " +
                    "Appuyez sur RETOUR ACCUEIL pour revenir à la page d'accueil.";
            }
        });
    }

    setResult(data){
        this._winner=data.winner === localStorage.getItem('username');
        if(this.shadowRoot && this.shadowRoot.querySelector('#message')) this.render();
    }

    render(){
        if(!this.shadowRoot) return;
        const message = this.shadowRoot.querySelector('#message');
        const positiveBtn = this.shadowRoot.querySelector('#revenge-btn');

        if (!message || !positiveBtn) return;

        const amIWinner = this._winner === localStorage.getItem('username');

        if(amIWinner){
            message.innerText = "Vous avez gagné cette partie. Relancer une autre partie avec ce même adversaire?";
            positiveBtn.innerText = "Rejouer";
        }
        else{
            message.innerText = "Vous avez perdu cette partie. Demander une revanche à cet adversaire?";
            positiveBtn.innerText = "Revanche";
        }
    }

    disconnectedCallback() {
        this.socket.off("revenge-request");
        this.socket.off("back-to-homepage");
    }
}

customElements.define('revenge-component', RevengeComponent);