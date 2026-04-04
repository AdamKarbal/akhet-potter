    const { getUser, getCollection } = require('./database');
    const jwt = require('jsonwebtoken');
    const {sendResponse} = require("./utils");

    const SECRET_KEY = process.env.JWT_SECRET;
    const REFRESH_SECRET = process.env.REFRESH_SECRET;

    function verifyToken(req) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) return null;
        try {
            return jwt.verify(token, SECRET_KEY);
        } catch (e) {
            const decoded = jwt.decode(token);
            console.log(`Something went wrong with ${decoded? decoded.username : 'unknown user'}'s token verification`)
            return null;
        }
    }

    async function login(username, password) {
        const user = await getUser(username);

        if (!user) return { error: "Utilisateur inconnu", status: 401 };

        if (user.password !== password) return { error: "Mot de passe incorrect", status: 401 };

        const payload = {
            username: user.username,
            elo: user.elo,
            rank: user.rank,
            friends: user.friends
        };

        const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: '60m' });

        const refreshToken = jwt.sign({ username: user.username }, REFRESH_SECRET, { expiresIn: '7d' });

        return { accessToken, refreshToken, message: "Succès", status: 200 };
    }

    async function signup(username, password) {

        const existing = await getUser(username);
        if (existing) return { error: "Existe déjà", status: 409 };

        const users = getCollection('users');
        await users.insertOne({ username, password, elo: 500, rank: "1ère année", friends: [] });

        return { message: "Utilisateur créé", status: 201 };
    }

    async function refresh(oldRefreshToken) {
        try {
            // On vérifie si le refresh token est valide
            const decoded = jwt.verify(oldRefreshToken, REFRESH_SECRET);
            const user = await getUser(decoded.username);
            if (!user) return { error: "Utilisateur non trouvé", status: 404 };

            const payload = {
                username: user.username,
                elo: user.elo || 1000,
                rank: user.rank || "1ère Année"
            };

            // Si oui, on génère un nv Access Token
            const newAccessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: '15m' });

            return { accessToken: newAccessToken, status: 200 };
        } catch (e) {
            return { error: "Refresh token invalide ou expiré", status: 403 };
        }
    }

    async function searchUsers(query) {
        try{
            const usersCollection = getCollection('users');

            const safeQuery = escapeRegExp(query);
            const regex = new RegExp('^' + safeQuery, 'i');

            const results = await usersCollection.find({ username: regex })
                .limit(10)
                .toArray();

            //results.filter(u => u.username !== query.username);

            return { users: results, status : 200 };
        }
        catch (e) {
            return { error: `Recherche impossible : ${e}`, status: 403 };
        }
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async function addFriendRequest(fromUser, toUser){
        const requests = getCollection('friends');
        const users = getCollection('users');

        const existing = await requests.findOne({
            $or: [
                { from: fromUser, to: toUser, status: "pending" },
                { from: toUser, to: fromUser, status: "pending" }
            ]
        });

        if(existing) return {error : 'Déjà envoyé', status: 400 };

        const user = await users.findOne({username: fromUser});
        if(user.friends && user.friends.includes(toUser)) return {error : 'Vous êtes déja amis.', status: 400 };

        await requests.insertOne({
            from: fromUser,
            to: toUser,
            status: "pending",
            timeStamp: Date.now(),
        });

        return {message: "Demande enregistrée", status: 201};
    }

    async function acceptFriendRequest(fromUser, toUser){
        const requests = getCollection('friends');
        const users = getCollection('users');
        const existing = await requests.findOne({ from: fromUser, to: toUser });
        if(existing){
            await requests.updateOne(
                { from: fromUser, to: toUser },
                { $set: { status: "accepted" } }
            );

            await users.updateOne({ username: toUser }, { $addToSet: { friends: fromUser } });
            await users.updateOne({ username: fromUser }, { $addToSet: { friends: toUser } });

            return { message: "Demande acceptée !", status: 200 };
        }

        return {message: "Demande introuvable", status: 400};
    }

    async function denyFriendRequest(fromUser, toUser){
        const requests = getCollection('friends');
        const existing = await requests.findOne({ from: fromUser, to: toUser });
        if(existing){
            await requests.updateOne(
                { from: fromUser, to: toUser },
                { $set: { status: "denied" } }
            );
            return {message: "Demande refusée par le destinataire", status: 201};
        }

        return {message: "Demande introuvable", status: 400};
    }

    async function getFriendRequests(toUser) {
        const requestsColl = getCollection('friends');
        const usersColl = getCollection('users');

        const pendingRequests = await requestsColl.find({ to: toUser, status: "pending" }).toArray();

        const enrichedRequests = await Promise.all(pendingRequests.map(async (req) => {
            const senderInfo = await usersColl.findOne({ username: req.from });
            return {
                username: req.from,
                rank: senderInfo?.rank || "1ère Année",
                elo: senderInfo?.elo || 1000
            };
        }));

        return { users: enrichedRequests, status: 200 };
    }

    async function getFriendList(ofUser){
        const usersCollection = await getCollection('users');
        const userDoc = await getUser(ofUser);
        if (!userDoc || !userDoc.friends) return { response: [], status: 404 };

        const response = await usersCollection.find({
            username: { $in: userDoc.friends }
        }).toArray();

        return { response, status: 200 };
    }

    async function removeFriend(username, friend){
        const users = getCollection('users');

        const aller = await users.updateOne(
            { username : username },
            { $pull: { friends: friend } }
        )

        const retour = await users.updateOne(
            { username : friend },
            { $pull: { friends: username } }
        )

        if(aller.modifiedCount === 0 || retour.modifiedCount === 0){
            return { message : "Aucune modification apportée (déjà retiré ou inexistant (innatendu)", status : 404 }
        }

        return { message : "Suppression effectuée", status : 200}
    }

    async function logout() {
        try {
            console.log("Déconnexion en cours...");
            const cookieExpiration = `refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`;
            return { cookie: cookieExpiration, status: 200 };
        } catch (e) {
            return sendResponse(res, 500, { error: "Erreur lors du logout" });
        }
    }

    function getRankFromElo(elo) {
        const rank = Math.floor(elo / 1000) + 1;
        const finalRank = Math.min(7, rank);
        const suffix = finalRank === 1 ? 'ère' : 'ème';
        return `${finalRank}${suffix} année`;
    }

    async function updateElo(winner, looser){
        const users = getCollection('users');
        const [w, l] = await Promise.all([
            users.findOne({ username: winner }),
            users.findOne({ username: looser })
        ]);

        const expectedW = 1 / (1 + Math.pow(10, (l.elo - w.elo) / 400));
        const expectedL = 1 / (1 + Math.pow(10, (w.elo - l.elo) / 400));

        const wGain = Math.round(100 * (1 - expectedW));
        const lGain = Math.round(100 * (0 - expectedL));

        const newEloW = w.elo + wGain;
        const newEloL = Math.max(100,l.elo + lGain);
        const newRankW = getRankFromElo(newEloW);
        const newRankL = getRankFromElo(newEloL);

        //eloDraw possible?
        //const eloDraw = w.elo + 100 * (0.5 - expectedResult);

        await Promise.all([
            users.updateOne({ username: winner }, {
                $set: { elo: newEloW, rank: newRankW }
            }),
            users.updateOne({ username: looser }, {
                $set: { elo: newEloL, rank: newRankL }
            })
        ]);

        return { winnerInfos: {username: winner, newRank : newRankW, newWinnerElo : newEloW, wGain : wGain},
            looserInfos: {username: looser, newRank : newRankL, newLooserElo : newEloL, lGain : lGain},
            message : "Modification des elos et ranks effectuée", status : 200}
    }

    module.exports = { login, signup, refresh, searchUsers,
        acceptFriendRequest, addFriendRequest, denyFriendRequest,
        getFriendRequests,verifyToken, getFriendList,
        removeFriend, logout, updateElo };