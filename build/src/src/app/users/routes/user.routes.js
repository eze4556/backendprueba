"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controllers_1 = __importDefault(require("../controllers/user.controllers"));
const token_1 = __importDefault(require("../../../auth/token/token"));
const password_middlewares_1 = __importDefault(require("../middlewares/password.middlewares"));
const code_middlewares_1 = __importDefault(require("../../codes/middlewares/code.middlewares"));
const history_middlewares_1 = __importDefault(require("../../history/middlewares/history.middlewares"));
const router = (0, express_1.Router)();
// Middleware to check if an email already exists in the system
async function checkEmail(req, res, next) {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ message: 'Email is required.' });
        return;
    }
    try {
        // Replace this with your actual database or service lookup.
        // For now, we simulate that no user exists.
        const userExists = await findUserByEmail(email);
        if (userExists) {
            res.status(409).json({ message: 'Email already in use.' });
            return;
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
// A dummy function simulating a user lookup. Replace with your actual implementation.
async function findUserByEmail(email) {
    // Example: Query your database to find a user by email.
    // Return true if a user is found, otherwise false.
    return false;
}
// Middleware to check if a user account is active
async function checkActive(req, res, next) {
    try {
        // The user ID is likely set by the Token.verifyToken middleware
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized access.' });
            return;
        }
        // Replace with your actual database query
        const user = await findUserById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({ message: 'Account is inactive.' });
            return;
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
// Helper function to find a user by ID
async function findUserById(userId) {
    // Example: Query your database to find a user by ID
    // Return the user object if found, otherwise null
    return { id: userId, isActive: true }; // Placeholder implementation
}
router.post('/register_request', checkEmail, // Check user not exist
code_middlewares_1.default.sendCode, // Send the request
history_middlewares_1.default.saveHistory('register request'), // Save history
token_1.default.generateToken // Generate token
);
router.post('/register_user', token_1.default.verifyToken, // Verify token and set email
checkEmail, // Check user not exist
code_middlewares_1.default.checkCode, // Validate there is not a previously code
password_middlewares_1.default.passwordComplexity, // Check password complexity
history_middlewares_1.default.saveHistory('register new user'), // Save history
user_controllers_1.default.registerUser // Register new user
);
router.post('/edit_user', token_1.default.verifyToken, // Verify token and set id
checkActive, // Check user is active
history_middlewares_1.default.saveHistory('edit user data'), // Save history
user_controllers_1.default.editUser // Edit an existing user
);
router.post('/get_data', token_1.default.verifyToken, // Verify token
checkActive, // Check user is active
user_controllers_1.default.getUser // Get user data
);
// Removed duplicate route with incomplete implementation.
router.get('/profile', token_1.default.verifyToken, (req, res) => { res.send('Profile data'); });
exports.default = router;
