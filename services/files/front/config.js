const capacitor = typeof window !== "undefined" ? window.Capacitor : undefined;

export const API_URL =
	capacitor && typeof capacitor.getPlatform === "function" && capacitor.getPlatform() !== "web"
		? "http://akhetpotter.ps8.pns.academy"
		: window.location.origin;

console.log("API Host cible :", API_URL);
