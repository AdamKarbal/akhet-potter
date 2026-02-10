const { MongoClient } = require('mongodb');
const MONGO_URL = process.env.MONGO_URL || 'mongodb://db:27017';
const DB_NAME = 'akhet_db';

let db = null;

async function connect() {
    if (db) return db;
    try {
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        db = client.db(DB_NAME);
        console.log(`AuthService connecté à Mongo`);
        return db;
    } catch (err) {
        console.error("Erreur connexion Mongo:", err);
        throw err;
    }
}

function getCollection(name) {
    if (!db) throw new Error("La base de données n'est pas initialisée.");
    return db.collection(name);
}

async function getUser(username) {
    if (!db) throw new Error("La base de données n'est pas initialisée.");
    return await db.collection('users').findOne({username});
}

module.exports = { connect, getUser, getCollection };