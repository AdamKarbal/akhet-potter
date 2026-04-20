import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
import {API_URL} from "../config.js";
import {AuthService as authService} from "./services/AuthService.js";

export const socket = io(API_URL, {
    transports: ["websocket"],
    auth: {token: null},
    autoConnect: false,
    withCredentials: true
});

async function getFreshToken() {
    const token = await authService.getValidToken();
    return token;
}

export async function connectSocket() {
    const token = await getFreshToken();
    socket.auth = { token };
    if (!socket.connected) socket.connect();
}

export function disconnectSocket() {
    if (socket.connected) socket.disconnect();
}

socket.on("connect_error", async (err) => {
    const msg = (err && err.message) ? err.message.toLowerCase() : "";
    if (msg.includes("jwt expired") || msg.includes("invalid token")) {
        try {
            const token = await authService.getValidToken();
            socket.auth = { token };
            socket.connect();
        } catch (_) {
            disconnectSocket();
        }
    }
});