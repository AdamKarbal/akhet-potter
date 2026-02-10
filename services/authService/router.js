const handlers = require('./handlers');
const { sendResponse } = require('./utils');

async function routeRequest(req, res) {
    if (req.method === 'OPTIONS') return sendResponse(res, 204, {});

    const url = req.url.split('?')[0].replace(/\/$/, "");

    if (req.method === 'POST') {
        if (url === '/login') return await handlers.handleLogin(req, res);
        if (url === '/signup') return await handlers.handleSignup(req, res);
        if (url === '/refresh') return await handlers.handleRefresh(req, res);
    }

    sendResponse(res, 404, { error: "Route inconnue" });
}

module.exports = { routeRequest };