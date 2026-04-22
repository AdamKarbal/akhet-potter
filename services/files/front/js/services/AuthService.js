import {API_URL} from "../../config.js";

export const AuthService = {
  async getValidToken(){
    const stored = localStorage.getItem('token');
    if (!stored) return null;

    // decode payload safely (no dépendances)
    try {
      const parts = stored.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
        const exp = payload.exp;
        const now = Math.floor(Date.now() / 1000);
        // si encore valide (avec petite marge de 5s)
        if (exp && exp > now + 5) return stored;
      }
    } catch (e) {
      // si parse échoue, tenter refresh
    }

    // token expiré → tenter refresh via cookie (refresh token stocké côté serveur en cookie HttpOnly)
    try {
      const resp = await fetch(API_URL + '/api/refresh', { method: 'POST', credentials: 'include' });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data?.accessToken) {
        localStorage.setItem('token', data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch (e) {
      console.error("Erreur refresh token:", e);
      return null;
    }
  }
}