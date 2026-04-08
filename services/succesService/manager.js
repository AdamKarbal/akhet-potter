const { getCollection } = require('./database');

// Liste des succes, si on veut en rajouter juste rajouter dans la liste
const MASTER_ACHIEVEMENTS = [
    { id: "play_online", title: "Premier Sang", desc: "Lancer une partie en ligne.", icon: "assets/pieces/old/scarabt1.webp" },
    { id: "play_ai", title: "Entraînement", desc: "Lancer une partie contre l'IA.", icon: "assets/pieces/old/scarabt2.webp" },
    { id: "win_ai", title: "L'Élève dépasse le Maître", desc: "Gagner contre l'IA.", icon: "assets/pieces/old/pharaont1.webp" },
    { id: "add_friend", title: "Sociable", desc: "Ajouter un ami.", icon: "assets/pieces/old/anubist1.webp" },
    { id: "play_friend", title: "Règlement de Comptes", desc: "Lancer un duel contre un ami.", icon: "assets/pieces/old/anubist2.webp" },
    { id: "chat_global", title: "Bavard", desc: "Envoyer un message dans le chat global.", icon: "assets/globalchat.webp" },
    { id: "win_online", title: "Sorcier", desc: "Gagner une partie en ligne.", icon: "assets/pieces/old/pharaont2.webp" },
    { id: "win_multiple_online", title: "Champion des trois sorciers", desc: "Gagner 100 partie en ligne.", icon: "assets/pieces/old/sphinxt1.webp" }
];

async function getAchievementsList(username) {
    const coll = getCollection('user_achievements');
    const userDoc = await coll.findOne({ username });

    // liste des succes debloque
    const unlockedIds = userDoc ? userDoc.unlocked : [];
    const fullList = MASTER_ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: unlockedIds.includes(ach.id)
    }));

    return { achievements: fullList, status: 200 };
}

async function unlockAchievement(username, achievementId) {
    const exists = MASTER_ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!exists) return { error: "Ce succès n'existe pas.", status: 404 };
    const coll = getCollection('user_achievements');
    if (achievementId === "win_online") {
        await coll.updateOne(
            { username: username },
            {
                $addToSet: { unlocked: achievementId },
                $inc: { pvpWins: 1 }
            },
            { upsert: true }
        );
        const userDoc = await coll.findOne({ username: username });
        if (userDoc && userDoc.pvpWins >= 100) {
            await coll.updateOne(
                { username: username },
                { $addToSet: { unlocked: "win_multiple_online" } }
            );
        }
    }
    await coll.updateOne(
        { username: username },
        { $addToSet: { unlocked: achievementId } },
        { upsert: true } // Crée le doc si pas gg avant
    );

    return { message: "Succès débloqué !", achievement: exists, status: 200 };
}

module.exports = { getAchievementsList, unlockAchievement };