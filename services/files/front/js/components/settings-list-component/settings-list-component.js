import "../setting-component/setting-component.js";
import { API_URL } from "../../../config.js";
import { AuthService } from "../../services/AuthService.js";
import { audioService } from "../../services/AudioService.js";

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

    this.initializeMusicSetting();
    await this.renderLogoutAction();
  }

  initializeMusicSetting() {
    const musicSetting = this.querySelector("#musicSetting");
    if (!musicSetting) return;

    const currentVolume = Math.round(audioService.getMusicVolume() * 100);
    musicSetting.setValue(currentVolume);

    musicSetting.onValueChange = ({ type, value }) => {
      if (type !== "volume") return;
      audioService.setMusicVolume(value / 100);
    };
  }

  async renderLogoutAction() {
    const settingsList = this.querySelector(".settings-list");
    if (!settingsList) return;

    const token = await AuthService.getValidToken();
    const username = localStorage.getItem("username");

    if (!token || !username) return;

    const logoutItem = document.createElement("button");
    logoutItem.type = "button";
    logoutItem.className = "logout-setting";
    logoutItem.innerHTML = `
      <img src="assets/webp/logout.webp" alt="Déconnexion">
      <span>Se déconnecter</span>
    `;

    logoutItem.addEventListener("click", async () => {
      try {
        const response = await fetch(API_URL + "/api/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          localStorage.clear();
          window.location.hash = "LGN";
          window.location.reload();
          return;
        }
      } catch (error) {
        console.log("Erreur lors de la déconnexion:", error);
      }

      localStorage.clear();
      window.location.hash = "LGN";
      window.location.reload();
    });

    settingsList.appendChild(logoutItem);
  }
}

customElements.define('settings-list-component', SettingsListComponent);

