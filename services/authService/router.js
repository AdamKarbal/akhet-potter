const handlers = require('./handlers');
const { sendResponse } = require('./utils');

async function routeRequest(req, res) {
    if (req.method === 'OPTIONS') return sendResponse(res, 204, {});

    const url = req.url.split('?')[0].replace(/\/$/, "");
    const normalizedUrl = url.replace(/^\/api/, "");

    if (req.method === 'POST') {
        if (normalizedUrl === '/login') return await handlers.handleLogin(req, res);
        if (normalizedUrl === '/signup') return await handlers.handleSignup(req, res);
        if (normalizedUrl === '/refresh') return await handlers.handleRefresh(req, res);
        if (normalizedUrl === '/managereq') return await handlers.handleDecisionRequest(req, res);
        if (normalizedUrl === '/sendreq') return await handlers.handleSendRequest(req, res);
        if(normalizedUrl === '/removefriend') return await handlers.handleRemoveFriend(req, res);
        if(normalizedUrl === '/logout') return await handlers.handleLogout(req, res);
        if(normalizedUrl === '/update-elo') return await handlers.handleEloUpdate(req, res)
        if (normalizedUrl === '/reset-password') return await handlers.handleResetPassword(req, res);
    }

    if (req.method === 'GET') {
        if (normalizedUrl === '/users/search') return await handlers.handleUserResearch(req, res);
        if (normalizedUrl === '/requests') return await handlers.handleRequestsResearch(req, res);
        if (normalizedUrl === '/friends') return await handlers.handleGetFriendList(req, res);
        if (normalizedUrl === '/security-question') return await handlers.handleGetSecurityQuestion(req, res);
    }

    sendResponse(res, 404, { error: "Route inconnue" });
}

module.exports = { routeRequest };
