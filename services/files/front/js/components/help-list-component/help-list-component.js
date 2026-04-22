export class HelpListComponent extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    try {
      console.log("help-list-component connected");
      const html = await fetch('./js/components/help-list-component/help-list-component.html').then(r => {
        console.log("HTML response:", r);
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.text();
      });

      console.log("HTML loaded:", html.length);

      this.innerHTML = `
        <link rel="stylesheet" href="./js/components/help-list-component/help-list-component.css">
        ${html}
      `;

      console.log("help-list-component rendered");
    } catch (error) {
      console.error("Failed to load help-list-component resources:", error);
      this.innerHTML = `<p style="color: #ffd700;">Erreur: ${error.message}</p>`;
    }
  }
}

customElements.define('help-list-component', HelpListComponent);

