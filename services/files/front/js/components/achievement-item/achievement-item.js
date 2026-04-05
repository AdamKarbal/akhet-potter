export class AchievementItem extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        const htmlUrl = new URL('./achievement-item.html', import.meta.url);
        const cssUrl = new URL('./achievement-item.css', import.meta.url);
        const response = await fetch(htmlUrl);
        const html = await response.text();
        this.innerHTML = `
            <link rel="stylesheet" href="${cssUrl.href}">
            ${html}
        `;

        const title = this.getAttribute('title') || 'Succès Inconnu';
        const description = this.getAttribute('description') || 'Description mystère...';
        const icon = this.getAttribute('icon') || 'assets/vifdor.png';
        const unlocked = this.getAttribute('unlocked') === 'true';

        const card = this.querySelector('#card');
        const statusIcon = this.querySelector('#status-icon');
        const iconImg = this.querySelector('#icon');
        const titleDiv = this.querySelector('#title');
        const descDiv = this.querySelector('#desc');

        if (unlocked) {
            card.classList.add('unlocked');
            statusIcon.innerText = '✓';
        } else {
            statusIcon.innerText = '🔒';
        }

        if (iconImg) {
            iconImg.src = icon;
            iconImg.alt = title;
        }

        if (titleDiv) titleDiv.innerText = title;
        if (descDiv) descDiv.innerText = description;
    }
}

customElements.define('achievement-item', AchievementItem);
