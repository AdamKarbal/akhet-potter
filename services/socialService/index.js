const http = require('http');
const { Server } = require('socket.io');
const { setupSockets } = require('./socketManager');

const PORT = 8004;

// création serveur
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Social Service est actif !");
});

const io = new Server(server, {
    path: '/social.io',
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

setupSockets(io);

// ecoute
server.listen(PORT, () => {
    console.log(`SocialService démarré sur le port ${PORT}`);
});