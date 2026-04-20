const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

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
        'Access-Control-Allow-Origin': 'http://localhost',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, PATCH, DELETE',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization, Cache-Control, Pragma'
    });
    res.end(JSON.stringify(data));
}

function verifyToken(req) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (e) {
        return null;
    }
}

module.exports = { parseBody, sendResponse, verifyToken };