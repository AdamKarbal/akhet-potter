const http = require('http');
const { connect } = require('./database');
const { routeRequest } = require('./router');
const PORT = 8005;

connect().then(() => {
    const server = http.createServer((req, res) => {
        routeRequest(req, res);
    });
    server.listen(PORT, () => {
        console.log(`SuccesService démarré sur le port ${PORT}`);
    });
}).catch(err => {
    console.error("Impossible de démarrer SuccesService sans DB:", err);
});