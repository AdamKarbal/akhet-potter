import "../../components/navbar-component/navbar-component.js";

export class MobileSettingsHelpPage extends HTMLElement {
  constructor() {
    super();
    this._componentImports = {};
    this._loadedComponents = new Set();
  }

  async connectedCallback() {
    try {
      const html = await fetch('./js/pages/mobile-settings-help-page/mobile-settings-help-page.html').then(r => r.text());

      this.innerHTML = `
        <link rel="stylesheet" href="./js/pages/mobile-settings-help-page/mobile-settings-help-page.css">
        ${html}
      `;

      this._setupTabs();
      await new Promise(resolve => setTimeout(resolve, 100));
      await this._loadInitialComponent();
    } catch (error) {
      console.error("Failed to load mobile-settings-help-page resources:", error);
    }
  }

  _setupTabs() {
    const buttons = this.querySelectorAll('.tab-button');
    buttons.forEach(button => {
      button.addEventListener('click', async () => {
        const tabName = button.getAttribute('data-tab');
        const componentName = button.getAttribute('data-component');

        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        if (componentName && tabName) {
          await this._loadComponent(tabName, componentName);
        }
      });
    });
  }

  async _loadInitialComponent() {
    const firstButton = this.querySelector('.tab-button.active');
    if (!firstButton) return;

    const tabName = firstButton.getAttribute('data-tab');
    const componentName = firstButton.getAttribute('data-component');

    if (componentName && tabName) {
      await this._loadComponent(tabName, componentName);
    }
  }

  async _loadComponent(tabName, componentName) {
    const container = this.querySelector(`#${tabName}`);
    if (!container) return;

    try {
      container.innerHTML = '';
      console.log(`Chargement de ${componentName}...`);

      if (!this._loadedComponents.has(componentName)) {
        console.log(`Import du module ${componentName}`);
        await this._importComponent(componentName);
        this._loadedComponents.add(componentName);
        console.log(`Module ${componentName} importé`);
      }

      console.log(`Création de l'élément ${componentName}`);
      const element = document.createElement(componentName);
      console.log(`Élément créé:`, element);
      container.appendChild(element);
      console.log(`${componentName} ajouté au DOM`);
    } catch (error) {
      console.error(`Erreur chargement ${componentName}:`, error);
      container.innerHTML = `<p style="color: #ffd700;">Erreur: ${error.message}</p>`;
    }
  }

  async _importComponent(componentName) {
    const componentMap = {
      'settings-list-component': '../../components/settings-list-component/settings-list-component.js',
      'component-2': '../../components/component-2/component-2.js',
    };

    const componentPath = componentMap[componentName];
    if (!componentPath) {
      throw new Error(`Composant ${componentName} non configuré`);
    }

    if (!this._componentImports[componentName]) {
      const moduleUrl = new URL(componentPath, import.meta.url);
      console.log(`Import depuis:`, moduleUrl.href);
      this._componentImports[componentName] = await import(moduleUrl.href);
    }

    return this._componentImports[componentName];
  }
}

customElements.define('mobile-settings-help-page', MobileSettingsHelpPage);