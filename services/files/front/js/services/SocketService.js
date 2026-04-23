import { AuthService } from "./AuthService.js";
import {API_URL} from "../../config.js";

const SOCKET_IO_ESM_URL = "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

class SocketService {
    constructor() {
        this.socket = null;
    }

    async connect() {
        if (this.socket?.connected) return;

        const token = await AuthService.getValidToken();
        if (!token) return;

        const { io } = await import(SOCKET_IO_ESM_URL);
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
