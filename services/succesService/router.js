const handlers = require('./handlers');
const { sendResponse } = require('./utils');

async function routeRequest(req, res) {
    if (req.method === 'OPTIONS') return sendResponse(res, 204, {});

    const url = req.url.split('?')[0].replace(/\/$/, "");

    if (req.method === 'GET') {
        if (url === '/achievements') return await handlers.handleGetAchievements(req, res);
    }

    if (req.method === 'POST') {
        if (url === '/achievements/unlock') return await handlers.handleUnlockAchievement(req, res);
    }

    sendResponse(res, 404, { error: "Route inconnue dans SuccesService" });
}

module.exports = { routeRequest };