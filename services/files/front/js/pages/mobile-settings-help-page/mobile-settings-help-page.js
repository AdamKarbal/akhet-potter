import "../../components/navbar-component/navbar-component.js";
import "../../components/progression-bar/progression-bar.js";
import { API_URL } from "../../../config.js";
import { AuthService } from "../../services/AuthService.js";

export class MobileSettingsHelpPage extends HTMLElement {
  constructor() {
    super();
    this._componentImports = {};
    this._loadedComponents = new Set();
    this.RANK_MAPPER = {
      "Non class\u00e9": "assets/webp/unranked.webp",
      "1\u00e8re ann\u00e9e": "assets/webp/annee1.webp",
      "2\u00e8me ann\u00e9e": "assets/webp/annee2.webp",
      "3\u00e8me ann\u00e9e": "assets/webp/annee3.webp",
      "4\u00e8me ann\u00e9e": "assets/webp/annee4.webp",
      "5\u00e8me ann\u00e9e": "assets/webp/annee5.webp",
      "6\u00e8me ann\u00e9e": "assets/webp/annee6.webp",
      "7\u00e8me ann\u00e9e": "assets/webp/annee7.webp",
    };
  }

  async connectedCallback() {
    try {
      const html = await fetch("./js/pages/mobile-settings-help-page/mobile-settings-help-page.html").then((r) => r.text());

      this.innerHTML = `
        <link rel="stylesheet" href="./js/pages/mobile-settings-help-page/mobile-settings-help-page.css">
        ${html}
      `;

      this._setupTabs();
      this.fillUserInfo();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await this._loadInitialComponent();
      await this.retrievePlayerInfo();
    } catch (error) {
      console.error("Failed to load mobile-settings-help-page resources:", error);
    }
  }

  async retrievePlayerInfo() {
    const section = this.querySelector(".user-rank");
    if (!section) return;

    const token = await AuthService.getValidToken();
    const user = localStorage.getItem("username");

    if (!token || !user) {
      this.fillUserInfo();
      return;
    }

    try {
      const response = await fetch(API_URL + `/api/users/search?username=${user}&t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        const currentUser = users?.[0];

        if (!currentUser) {
          localStorage.clear();
          this.fillUserInfo();
          return;
        }

        this.fillUserInfo(currentUser.rank, currentUser.elo, currentUser.username);
        return;
      }
    } catch (error) {
      console.error("Erreur lors de la r\u00e9cup\u00e9ration des infos joueur:", error);
    }

    this.fillUserInfo();
  }

  fillUserInfo(rank, elo, username) {
    const section = this.querySelector(".user-rank");
    if (!section) return;

    section.innerHTML = "";

    if (!rank || !elo || !username) {
      section.classList.add("disconnected");
      section.innerHTML = `
        <div class="user-rank-main">
          <div class="username-card">
            <img class="payloadimg" src="assets/goodplayer.webp">
            <span class="payloadtext">Invit\u00e9</span>
          </div>
          <div class="rank unavailable">
            <img class="payloadimg" src="${this.RANK_MAPPER["Non class\u00e9"]}">
            <span class="payloadtext">Non class\u00e9</span>
          </div>
          <div class="elo">
            <img class="payloadimg" src="assets/vifdor-1.webp">
            <span class="payloadtext">---</span>
          </div>
        </div>
        <button type="button" class="login-btn">Se connecter</button>
      `;

      const loginBtn = section.querySelector(".login-btn");
      if (loginBtn) {
        loginBtn.addEventListener("click", () => {
          window.location.hash = "LGN";
        });
      }
      return;
    }

    section.classList.remove("disconnected");

    const imgPath = this.RANK_MAPPER[rank] ?? this.RANK_MAPPER["Non class\u00e9"];

    const usernameDiv = document.createElement("div");
    usernameDiv.innerHTML = `
      <img class="payloadimg" src="assets/goodplayer.webp">
      <span class="payloadtext">${username}</span>`;
    usernameDiv.classList.add("username-card");
    section.appendChild(usernameDiv);

    const rankDiv = document.createElement("div");
    rankDiv.classList.add("rank");
    rankDiv.innerHTML = `
      <img class="payloadimg" src="${imgPath}">
      <span class="payloadtext">${rank}</span>`;
    section.appendChild(rankDiv);

    const eloDiv = document.createElement("div");
    eloDiv.innerHTML = `
      <img class="payloadimg" src="assets/vifdor-1.webp">
      <span class="payloadtext">${elo}</span>`;
    eloDiv.classList.add("elo");
    section.appendChild(eloDiv);

    const progBar = document.createElement("progression-bar");
    section.appendChild(progBar);
    progBar.updateProgress(rank, elo);
  }

  _setupTabs() {
    const buttons = this.querySelectorAll(".tab-button");
    const contents = this.querySelectorAll(".tab-content");

    buttons.forEach((button) => {
      button.addEventListener("click", async () => {
        const tabName = button.getAttribute("data-tab");
        const componentName = button.getAttribute("data-component");

        buttons.forEach((btn) => btn.classList.remove("active"));
        contents.forEach((content) => content.classList.remove("active"));

        button.classList.add("active");
        const tabContent = this.querySelector(`#${tabName}`);
        if (tabContent) tabContent.classList.add("active");

        if (componentName && tabName) {
          await this._loadComponent(tabName, componentName);
        }
      });
    });
  }

  async _loadInitialComponent() {
    const firstButton = this.querySelector(".tab-button.active");
    if (!firstButton) return;

    const tabName = firstButton.getAttribute("data-tab");
    const componentName = firstButton.getAttribute("data-component");

    if (componentName && tabName) {
      await this._loadComponent(tabName, componentName);
    }
  }

  async _loadComponent(tabName, componentName) {
    const container = this.querySelector(`#${tabName}`);
    if (!container) return;

    try {
      container.innerHTML = "";

      if (!this._loadedComponents.has(componentName)) {
        await this._importComponent(componentName);
        this._loadedComponents.add(componentName);
      }

      const element = document.createElement(componentName);
      container.appendChild(element);
    } catch (error) {
      console.error(`Erreur chargement ${componentName}:`, error);
      container.innerHTML = `<p style="color: #ffd700;">Erreur: ${error.message}</p>`;
    }
  }

  async _importComponent(componentName) {
    const componentMap = {
      "settings-list-component": "../../components/settings-list-component/settings-list-component.js",
      "help-list-component": "../../components/help-list-component/help-list-component.js",
    };

    const componentPath = componentMap[componentName];
    if (!componentPath) {
      throw new Error(`Composant ${componentName} non configur\u00e9`);
    }

    if (!this._componentImports[componentName]) {
      const moduleUrl = new URL(componentPath, import.meta.url);
      this._componentImports[componentName] = await import(moduleUrl.href);
    }

    return this._componentImports[componentName];
  }
}

customElements.define("mobile-settings-help-page", MobileSettingsHelpPage);
