class SettingComponent extends HTMLElement {
  constructor() {
    super();
    this.onValueChange = null;
    this._boundHandleChange = this._handleChange.bind(this);
    this._fallbackText = "";
  }

  static get observedAttributes() {
    return ["type", "text", "img", "img-src", "img-alt"]; // "toggle" | "volume"
  }

  async connectedCallback() {
    this._fallbackText = this.textContent.trim();
    const htmlUrl = new URL('./setting-component.html', import.meta.url);
    const cssUrl = new URL('./setting-component.css', import.meta.url);
    const response = await fetch(htmlUrl);
    const html = await response.text();

    this.innerHTML = `
      <link rel="stylesheet" href="${cssUrl}">
      ${html}
    `;
    this._renderMeta();
    this._renderControl();
    this._attachListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "type" && oldValue !== newValue && this.isConnected){
      this._renderControl();
      this._attachListeners();
      return;
    }

    if (oldValue !== newValue && this.isConnected) {
      this._renderMeta();
    }
  }

  _renderMeta() {
    const image = this.querySelector("img");
    const label = this.querySelector("span");
    if (!image || !label) return;

    const src = this.getAttribute("img-src") || this.getAttribute("img") || "";
    const text = this.getAttribute("text") || this._fallbackText || "";
    const alt = this.getAttribute("img-alt") || text || "setting icon";

    if (src) {
      image.src = src;
      image.alt = alt;
      image.style.display = "";
    } else {
      image.removeAttribute("src");
      image.alt = "";
      image.style.display = "none";
    }

    label.textContent = text;
  }

  _renderControl() {
    const type = this.getAttribute("type") || "toggle";
    const container = this.querySelector(".setting-control");
    if (!container) return;
    // INFO: Modifier ici pour des composants personnalisés
    if (type === "volume") {
      container.innerHTML = `<input type="range" min="0" max="100" value="50" data-role="control">`;
    } else {
      // toggle par défaut
      container.innerHTML = `<input type="checkbox" data-role="control">`;
    }
  }

  _attachListeners() {
    const control = this.querySelector('[data-role="control"]');
    if (!control) return;

    control.removeEventListener("change", this._boundHandleChange);
    control.removeEventListener("input", this._boundHandleChange);

    control.addEventListener("change", this._boundHandleChange);
    control.addEventListener("input", this._boundHandleChange);

    // Si plus tard c'est un composant custom, il peut dispatcher "setting-change"
    control.addEventListener("setting-change", this._boundHandleChange);
  }

  _handleChange(event) {
    const control = event.currentTarget;
    const type = this.getAttribute("type") || "toggle";

    let value;
    if (event.type === "setting-change" && event.detail) {
      value = event.detail.value;
    } else if (type === "toggle") {
      value = control.checked;
    } else if (type === "volume") {
      value = Number(control.value);
    } else {
      value = control.value;
    }

    // 1) callback JS directe
    if (typeof this.onValueChange === "function") {
      this.onValueChange({ type, value, sourceEvent: event });
    }

    // 2) event DOM pour le parent
    this.dispatchEvent(new CustomEvent("setting-change", {
      detail: { type, value },
      bubbles: true
    }));
  }
}
customElements.define("setting-component", SettingComponent);