const manager = require('./manager');
const { parseBody, sendResponse, verifyToken } = require('./utils');

async function handleGetAchievements(req, res) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) return sendResponse(res, 401, { error: "Non autorisé" });

        const result = await manager.getAchievementsList(userPayload.username);
        return sendResponse(res, result.status, result.achievements);
    } catch (e) {
        console.error(e);
        return sendResponse(res, 500, { error: "Erreur interne" });
    }
}

async function handleUnlockAchievement(req, res) {
    try {
        const userPayload = verifyToken(req);
        if (!userPayload) return sendResponse(res, 401, { error: "Non autorisé" });

        const { achievementId } = await parseBody(req);
        if (!achievementId) return sendResponse(res, 400, { error: "ID du succès manquant" });

        const result = await manager.unlockAchievement(userPayload.username, achievementId);
        return sendResponse(res, result.status, result);
    } catch (e) {
        console.error(e);
        return sendResponse(res, 500, { error: "Erreur interne" });
    }
}

module.exports = { handleGetAchievements, handleUnlockAchievement };