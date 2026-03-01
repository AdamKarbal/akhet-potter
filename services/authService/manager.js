const { getUser, getCollection } = require('./database');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'akhetpottermeilleurjeu';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'akhetpotterrefresh';

async function login(username, password) {
    const user = await getUser(username);
    if (!user) return { error: "Utilisateur inconnu", status: 401 };
    if (user.password !== password) return { error: "Mot de passe incorrect", status: 401 };
    const payload = {
        username: user.username,
        elo: user.elo || 1000,
        rank: user.rank || "1ère Année"
    };
    const accessToken = jwt.sign(payload, SECRET_KEY, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ username: user.username }, REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken, message: "Succès", status: 200 };
}

async function signup(username, password) {
    const existing = await getUser(username);
    if (existing) return { error: "Existe déjà", status: 409 };
    const users = getCollection('users');
    await users.insertOne({ username, password, elo: 1000, rank: "1ère année" });
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

module.exports = { login, signup, refresh };