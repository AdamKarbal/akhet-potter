const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

function setupSockets(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Accès refusé: Pas de token fourni"));

        try {
            const decoded = jwt.verify(token, SECRET_KEY);
            socket.user = decoded;
            next();
        } catch (e) {
            next(new Error("Accès refusé: Token invalide ou expiré"));
        }
    });

    io.on('connection', (socket) => {
        const username = socket.user.username;
        console.log(`[SOCIAL] Le sorcier ${username} est connecté.`);
        socket.join('global_room');

        socket.on('global_message', (msg) => {
            socket.to('global_room').emit('global_message_receive', {
                sender: username,
                message: msg
            });
        });

        socket.on('join_game_chat', (gameId) => {
            const roomName = `game_${gameId}`;
            socket.join(roomName);
            console.log(`[SOCIAL] ${username} a rejoint le salon de chat du duel ${gameId}`);
        });

        socket.on('ingame_message', (data) => {
            const roomName = `game_${data.gameId}`;
            socket.to(roomName).emit('ingame_message_receive', {
                sender: username,
                message: data.msg
            });
        });

            socket.on('disconnect', () => {
            console.log(`[SOCIAL] ${username} a quitté le chat.`);
        });
    });
}

module.exports = { setupSockets };