import {API_URL} from "../config.js";
import {AuthService as authService} from "./services/AuthService.js";

const SOCKET_IO_ESM_URL = "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

let realSocket = null;
let ioFactoryPromise = null;
const queuedListeners = [];

async function loadIoFactory() {
    if (!ioFactoryPromise) {
        ioFactoryPromise = import(SOCKET_IO_ESM_URL).then((module) => module.io);
    }
    return ioFactoryPromise;
}

function replayListeners(target) {
    queuedListeners.forEach(({ event, handler, once }) => {
        if (once) target.once(event, handler);
        else target.on(event, handler);
    });
}

async function ensureSocket() {
    if (realSocket) return realSocket;
    const io = await loadIoFactory();
    realSocket = io(API_URL, {
        transports: ["websocket"],
        auth: {token: null},
        autoConnect: false,
        withCredentials: true
    });
    replayListeners(realSocket);
    attachConnectErrorHandler(realSocket);
    return realSocket;
}

async function getFreshToken() {
    return authService.getValidToken();
}

function attachConnectErrorHandler(target) {
    target.on("connect_error", async (err) => {
        const msg = (err && err.message) ? err.message.toLowerCase() : "";
        if (msg.includes("jwt expired") || msg.includes("invalid token")) {
            try {
                const token = await authService.getValidToken();
                target.auth = { token };
                target.connect();
            } catch (_) {
                disconnectSocket();
            }
        }
    });
}

export const socket = {
    get id() {
        return realSocket?.id;
    },
    get connected() {
        return Boolean(realSocket?.connected);
    },
    get auth() {
        return realSocket?.auth;
    },
    set auth(value) {
        if (realSocket) realSocket.auth = value;
    },
    on(event, handler) {
        queuedListeners.push({ event, handler, once: false });
        if (realSocket) realSocket.on(event, handler);
        return this;
    },
    once(event, handler) {
        queuedListeners.push({ event, handler, once: true });
        if (realSocket) realSocket.once(event, handler);
        return this;
    },
    off(event, handler) {
        for (let i = queuedListeners.length - 1; i >= 0; i--) {
            const item = queuedListeners[i];
            if (item.event === event && (!handler || item.handler === handler)) {
                queuedListeners.splice(i, 1);
            }
        }
        if (realSocket) realSocket.off(event, handler);
        return this;
    },
    emit(event, ...args) {
        if (!realSocket || !realSocket.connected) return false;
        return realSocket.emit(event, ...args);
    },
    connect() {
        return connectSocket();
    },
    disconnect() {
        disconnectSocket();
    }
};

export async function connectSocket() {
    const target = await ensureSocket();
    const token = await getFreshToken();
    target.auth = { token };
    if (!target.connected) target.connect();
    return target;
}

export function disconnectSocket() {
    if (realSocket?.connected) realSocket.disconnect();
}
