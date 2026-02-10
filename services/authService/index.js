const http = require('http');
const { connect } = require('./database');
const { routeRequest } = require('./router');
const PORT = 8002;

connect().then(() => {
    const server = http.createServer((req, res) => {
        routeRequest(req, res);
    });
    server.listen(PORT, () => {
        console.log(`AuthService démarré sur le port ${PORT}`);
    });

}).catch(err => {
    console.error("Impossible de démarrer AuthService sans DB:", err);
});