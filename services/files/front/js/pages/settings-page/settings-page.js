import "../../components/navbar-component/navbar-component.js";
import "../../components/setting-component/setting-component.js";
import "../../components/settings-list-component/settings-list-component.js";

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

            const setting = this.querySelector("#musicSetting");
            if (!setting) return;

            setting.onValueChange = ({ type, value }) => {
                console.log("Callback:", type, value);
            };

            setting.addEventListener("setting-change", (e) => {
                console.log("Event:", e.detail.type, e.detail.value);
            });
        } catch (error) {
            console.error("Failed to load settings page resources:", error);
        }
    }
}

customElements.define('settings-page', SettingsPage);