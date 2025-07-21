"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
exports.checkActive = checkActive;
exports.checkEmail = checkEmail;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_models_1 = __importDefault(require("../models/user.models"));
const JWT_SECRET = process.env.JWT_SECRET || 'test';
// Middleware para verificar el token JWT
function verifyToken(req, res, next) {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.replace('Bearer ', '');
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid token' });
            }
            req.user = decoded;
            next();
        });
    }
    catch (error) {
        return res.status(401).json({ message: 'Unauthorized', error: error.message });
    }
}
async function checkActive(req, res, next) {
    const { email } = req.body;
    const user = await user_models_1.default.findOne({ email });
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    if (!user.permissions.active)
        return res.status(403).json({ message: 'User is not active' });
    next();
}
async function checkEmail(req, res, next) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        // Buscar en la estructura anidada primary_data.email
        const user = await user_models_1.default.findOne({ 'primary_data.email': email.toLowerCase() });
        if (user) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        next();
    }
    catch (error) {
        console.error('Error in checkEmail middleware:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
}
