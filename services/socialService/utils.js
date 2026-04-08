const BLACKLIST = ["censure", "insulte", "motinterdit"];

function filterMessage(message) {
    if (!message) return message;

    let filteredMessage = message;

    BLACKLIST.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const stars = '*'.repeat(word.length);
        filteredMessage = filteredMessage.replace(regex, stars);
    });

    return filteredMessage;
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

module.exports = {unlockAchievement, filterMessage};