export async function unlockAchievement(token, achievementId) {
    if (!token) return;
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
        console.error(`[GAME] Erreur lors du déblocage du succès ${achievementId} :`, err.message);
    }
}