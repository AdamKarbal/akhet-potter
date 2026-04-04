const handlers = require('./handlers');
const { sendResponse } = require('./utils');

async function routeRequest(req, res) {
    if (req.method === 'OPTIONS') return sendResponse(res, 204, {});

    const url = req.url.split('?')[0].replace(/\/$/, "");

    if (req.method === 'POST') {
        if (url === '/login') return await handlers.handleLogin(req, res);
        if (url === '/signup') return await handlers.handleSignup(req, res);
        if (url === '/refresh') return await handlers.handleRefresh(req, res);
        if (url === '/managereq') return await handlers.handleDecisionRequest(req, res);
        if (url === '/sendreq') return await handlers.handleSendRequest(req, res);
        if(url === '/removefriend') return await handlers.handleRemoveFriend(req, res);
        if(url=== '/logout') return await handlers.handleLogout(req, res);
        if(url === '/update-elo') return await handlers.handleEloUpdate(req, res)
        if (url === '/reset-password') return await handlers.handleResetPassword(req, res);
    }

    if (req.method === 'GET') {
        if (url === '/users/search') return await handlers.handleUserResearch(req, res);
        if (url === '/requests') return await handlers.handleRequestsResearch(req, res);
        if (url === '/friends') return await handlers.handleGetFriendList(req, res);
        if (url === '/security-question') return await handlers.handleGetSecurityQuestion(req, res);
    }

    sendResponse(res, 404, { error: "Route inconnue" });
}

module.exports = { routeRequest };