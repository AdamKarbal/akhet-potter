export class SettingsListComponent extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    const htmlUrl = new URL('./settings-list-component.html', import.meta.url);
    const cssUrl = new URL('./settings-list-component.css', import.meta.url);
    const response = await fetch(htmlUrl);
    const html = await response.text();

    this.innerHTML = `
      <link rel="stylesheet" href="${cssUrl}">
      ${html}
    `;
  }
}

customElements.define('settings-list-component', SettingsListComponent);

