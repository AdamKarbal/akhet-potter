const manager = require('./manager');
const { parseBody, sendResponse } = require('./utils');
const {verifyToken} = require("./manager");

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

async function handleUserResearch(req, res) {
    try {
        const token = verifyToken(req);

        if (!token) {
            return sendResponse(res, 401, { error: "Non autorisé: Token manquant ou invalide" });
        }

        console.log("DEBUG TOKEN HANDLER :", token);

        const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const query = urlParams.get('username');

        if (!query || query.length < 2) return sendResponse(res, 400, {error: "Recherche trop courte (min. 2 caractères)"});

        const result = await manager.searchUsers(query);

        if (result.error) {
            return sendResponse(res, result.status, {error: result.error});
        }

        const users = result.users.map(u => ({
            username: u.username,
            rank: u.rank,
            elo: u.elo
        }));

        return sendResponse(res, 200, users);
    }
    catch(e){
        console.error(e);
        return sendResponse(res, 401, { error: "Erreur interne : token invalide" });
    }
}

async function handleRequestsResearch(req, res) {
    const userPayload = verifyToken(req);
    console.log("DEBUG Payload reçu :", userPayload);

    if (!userPayload || !userPayload.username) {
        return sendResponse(res, 401, { error: "Non autorisé : Token invalide ou expiré" });
    }

    const result = await manager.getFriendRequests(userPayload.username);
    console.log("Résultat brut du manager :", result.users);

    return sendResponse(res, 200, result.users);
}

async function handleDecisionRequest(req, res) {
    try{
        const userPayload = verifyToken(req);
        if(!userPayload) return sendResponse(res, 401, { error: "Session expirée" });
        const toUser = userPayload.username;
        const { decision , fromUser } = await parseBody(req);
        if(!decision || !fromUser || !toUser) return sendResponse(res, 400, { error: "Corps de la requête invalide" });

        let result;
        if (decision === "accept") {
            result = await manager.acceptFriendRequest(fromUser, toUser);
        } else {
            result = await manager.denyFriendRequest(fromUser, toUser);
        }

        return sendResponse(res, result.status, { message: result.message });
    }
    catch(e) {
        return sendResponse(res, 500, { error: "Erreur serveur" });
    }
}

async function handleSendRequest(req, res) {
    try{
        const userPayload = verifyToken(req);
        console.log("Utilisateur qui envoie sa requête :", userPayload?.username);
        if (!userPayload) return sendResponse(res, 401, { error: "Token invalide, non autorisé" });
        const body = await parseBody(req);
        const toUser = body.to;
        console.log("Utilisateur qui reçoit la requête :", toUser);
        const fromUser  = userPayload.username;
        if(!fromUser || !toUser) return sendResponse(res, 401, { error: "Pas de noms d'utilisateurs liés à la demande d'amis" });
        const result = await manager.addFriendRequest(fromUser, toUser);

        return sendResponse(res, 200, result.status, { message: result.message });
    }
    catch(e) {
        return sendResponse(res, 500, { error: "Erreur lors de l'envoi de la demande d'amis." });
    }
}

async function handleGetFriendList(req, res) {
    try{
        const userPayload = verifyToken(req);
        if (!userPayload) return sendResponse(res, 401, { error: "Token invalide, non autorisé" });

        const result = await manager.getFriendList(userPayload.username);

        if(result.error) return sendResponse(res, 400, result.status, { message: result.message });

        const friends = result.response.map(u => ({
            username: u.username,
            rank: u.rank,
            elo: u.elo,
        }));

        return sendResponse(res, 200, friends);
    }
    catch(e) {
        console.error(e);
        return sendResponse(res, 500, { message: "Internal error" });
    }
}

async function handleRemoveFriend(req, res){
    try{
        const userPayload = verifyToken(req);
        const body = await parseBody(req);
        if (!userPayload) return sendResponse(res, 401, { error: "Token invalide, non autorisé" });

        const result = await manager.removeFriend(userPayload.username, body.username);

        if(result.error) sendResponse(res, 400, result.status, {message : result.message});

        return sendResponse(res, 200, result.status, {message : result.message});
    }
    catch(e){
        return sendResponse(res, 500, { message : "Erreur serveur : ", e})
    }
}

async function handleLogout(req, res) {
    try{
        const userPayload = verifyToken(req);
        if (!userPayload) return sendResponse(res, 401, { error: "Token invalide, non autorisé" });

        const result = await manager.logout();

        res.setHeader('Set-Cookie', result.cookie);

        return sendResponse(res, 200, {message : "Déconnexion réussie."});
    }
    catch(e) {
        console.error("Erreur handler logout :", e);
        return sendResponse(res, 500, { message: "Erreur handler logout : " , e });
    }
}

async function handleEloUpdate(req, res) {
    try {
        const secret = req.headers['x-secret-key'];
        if(secret === "J3SU1SUNM4UV4ISTR1CH3UR"){
            return sendResponse(res, 403, {error: "T'as vraiment essayé en plus? Cours toujours mon gourmand."});
        }

        if(secret !== process.env.ELO_KEY){
            return sendResponse(res, 403, {error: "Accès refusé : t'as pas la clé secrète petit tricheur. " +
                    "Tiens, réessaye avec ça : " +
                    "'x-secret-key' = J3SU1SUNM4UV4ISTR1CH3UR"});
        }

        const body = await parseBody(req);
        if (!body.winner || !body.looser) return sendResponse(res, 400, {error: "Requête invalide, pas de gagnant ou de perdant fourni."});

        console.log(`[DEBUG] : Gagnant : ${body.winner}, Perdant : ${body.looser}`);
        const result = await manager.updateElo(body.winner, body.looser);

        if(result.error) return sendResponse(res, 400, result.status, {message : result.message});

        return sendResponse(res, 200, result);
    }
    catch (e){
        console.error("Erreur handler elo update :", e);
        return sendResponse(res, 500, { message: "Erreur handler elo update : " , e });
    }
}

module.exports = { handleLogin, handleSignup, handleRefresh,
    handleUserResearch, handleRequestsResearch, handleDecisionRequest,
    handleSendRequest, handleGetFriendList, handleRemoveFriend,
    handleLogout, handleEloUpdate };