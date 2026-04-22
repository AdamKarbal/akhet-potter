import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
import { AuthService } from "./AuthService.js";
import {API_URL} from "../../config.js";

class SocketService {
    constructor() {
        this.socket = null;
    }

    async connect() {
        if (this.socket?.connected) return;

        const token = await AuthService.getValidToken();
        if (!token) return;

        this.socket = io(API_URL, {
            path: "/socket.io",
            auth: {token: token},
            transports: ["websocket"]
        });

        this.socket.on("connect", () => {
            console.log("[Socket] Connecté au game server");
        });

        this.socket.on("disconnect", () => {
            console.log("[Socket] Déconnecté du game server");
        });
    }

    getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();