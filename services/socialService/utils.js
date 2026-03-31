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

module.exports = {unlockAchievement};