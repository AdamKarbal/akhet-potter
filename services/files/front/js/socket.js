import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

const token = localStorage.getItem('token');

export const socket = io("http://localhost:8003", {
    auth: { token }
});

