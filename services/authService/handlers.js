const manager = require('./manager');
const { parseBody, sendResponse } = require('./utils');

async function handleLogin(req, res) {
    try {
        const { username, password } = await parseBody(req);
        if (!username || !password) return sendResponse(res, 400, { error: "Champs manquants" });
        const result = await manager.login(username, password);
        if (result.status === 200) {
            const { accessToken, refreshToken, status, ...data } = result; // Destructuratation on separe le result en plusieurs info
            const cookieValue = `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${7*24*60*60}`; // on prepare la chaine de caractere brute pour le cookie
            res.setHeader('Set-Cookie', cookieValue);
            sendResponse(res, status, { ...data, token: accessToken });
        } else {
            const { status, ...data } = result;
            sendResponse(res, status, data);
        }

    } catch (e) {
        console.error(e);
        sendResponse(res, 500, { error: "Erreur interne" });
    }
}

async function handleSignup(req, res) {
    try {
        const { username, password } = await parseBody(req);
        if (!username || !password) return sendResponse(res, 400, { error: "Champs manquants" });

        const result = await manager.signup(username, password);
        const { status, ...data } = result;
        sendResponse(res, status, data);
    } catch (e) {
        console.error(e);
        sendResponse(res, 500, { error: "Erreur interne" });
    }
}

async function handleRefresh(req, res) {
    try {
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) return sendResponse(res, 401, { error: "Pas de cookie trouvé" });
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [name, value] = cookie.trim().split('=');
            acc[name] = value;
            return acc;
        }, {});
        const refreshToken = cookies['refreshToken'];
        if (!refreshToken) return sendResponse(res, 401, { error: "Pas de refresh token" });
        const result = await manager.refresh(refreshToken);
        const { status, ...data } = result;
        sendResponse(res, status, data);

    } catch (e) {
        console.error(e);
        sendResponse(res, 500, { error: "Erreur interne" });
    }
}

module.exports = { handleLogin, handleSignup, handleRefresh };