"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_middlewares_1 = require("../middlewares/user.middlewares");
const password_middlewares_1 = __importDefault(require("../middlewares/password.middlewares"));
const history_middlewares_1 = __importDefault(require("../../history/middlewares/history.middlewares"));
const token_1 = __importDefault(require("../../../auth/token/token"));
const router = (0, express_1.Router)();
// This middleware should be in its own file, not defined inline here
async function checkCredentials(req, res, next) {
    // Your logic here
    // Example:
    const { username, password } = req.body;
    if (username === 'test' && password === 'password') {
        // Successful authentication
        next();
    }
    else {
        // Authentication failed
        res.status(401).json({ message: 'Invalid credentials' });
    }
}
router.post('/', user_middlewares_1.checkActive, // Check user is active
password_middlewares_1.default.passwordComplexity, // Check password complexity
(req, res, next) => {
    checkCredentials(req, res, next);
}, // Check credentials
(req, res, next) => {
    history_middlewares_1.default.saveHistory('start session')(req, res, next);
}, // Save history
token_1.default.generateToken // Generate token
);
exports.default = router;
