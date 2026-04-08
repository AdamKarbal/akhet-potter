import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
import {API_URL} from "../config.js";

const token = localStorage.getItem('token');

export const socket = io(API_URL, {
    transports: ["websocket"],
    auth: { token }
});