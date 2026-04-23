class SettingComponent extends HTMLElement {
  constructor() {
    super();
    this.onValueChange = null;
    this._boundHandleChange = this._handleChange.bind(this);
    this._fallbackText = "";
    this._value = null;
  }

  static get observedAttributes() {
    return ["type", "text", "img", "img-src", "img-alt"];
  }

  async connectedCallback() {
    this._fallbackText = this.textContent.trim();
    const htmlUrl = new URL("./setting-component.html", import.meta.url);
    const cssUrl = new URL("./setting-component.css", import.meta.url);
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
    if (name === "type" && oldValue !== newValue && this.isConnected) {
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

    if (type === "volume") {
      const currentValue = this._value ?? 50;
      container.innerHTML = `<span class="volume-value">${currentValue}</span><input type="range" min="0" max="100" value="${currentValue}" data-role="control">`;
    } else {
      const isChecked = Boolean(this._value);
      container.innerHTML = `<input type="checkbox" data-role="control" ${isChecked ? "checked" : ""}>`;
    }
  }

  _attachListeners() {
    const control = this.querySelector("[data-role='control']");
    if (!control) return;

    control.removeEventListener("change", this._boundHandleChange);
    control.removeEventListener("input", this._boundHandleChange);

    control.addEventListener("change", this._boundHandleChange);
    control.addEventListener("input", this._boundHandleChange);

    if (control.type === "range") {
      control.addEventListener("input", () => {
        const valueDisplay = this.querySelector(".volume-value");
        if (valueDisplay) {
          valueDisplay.textContent = control.value;
        }
      });
    }

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

    if (typeof this.onValueChange === "function") {
      this.onValueChange({ type, value, sourceEvent: event });
    }

    this.dispatchEvent(new CustomEvent("setting-change", {
      detail: { type, value },
      bubbles: true
    }));
  }

  setValue(value) {
    this._value = value;

    const control = this.querySelector("[data-role='control']");
    if (!control) return;

    if (control.type === "range") {
      control.value = value;
      const valueDisplay = this.querySelector(".volume-value");
      if (valueDisplay) {
        valueDisplay.textContent = value;
      }
    } else if (control.type === "checkbox") {
      control.checked = Boolean(value);
    }
  }
}

customElements.define("setting-component", SettingComponent);
