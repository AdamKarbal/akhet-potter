export class PlayerInventory extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./player-inventory.html', import.meta.url);
        const cssUrl = new URL('./player-inventory.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();

        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;
    }

    setReserves(count) {
        const trySetReserves = () => {
            const countSpan = this.querySelector('#pyramid-count');
            const box = this.querySelector('#inv-box');

            if (countSpan && box) {
                countSpan.innerText = count;
                if (count <= 0) {
                    box.classList.add('empty');
                } else {
                    box.classList.remove('empty');
                }
            } else {
                setTimeout(trySetReserves, 50);
            }
        };

        trySetReserves();
    }
}

customElements.define('player-inventory', PlayerInventory);