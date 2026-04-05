async function parseBody(req) {
    const buffers = [];
    for await (const chunk of req) {
        buffers.push(chunk);
    }
    const data = Buffer.concat(buffers).toString();
    return data ? JSON.parse(data) : {};
}

function sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

async function unlockAchievement(token, achievementId) {
    try {
        await fetch('http://succes:8005/achievements/unlock', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ achievementId })
        });
    } catch (err) {
        console.error(`[SOCIAL] Erreur lors du déblocage du succès ${achievementId} :`, err.message);
    }
}

module.exports = { parseBody, sendResponse, unlockAchievement };