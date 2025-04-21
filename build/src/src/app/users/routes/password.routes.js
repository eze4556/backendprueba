"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const token_1 = __importDefault(require("../../../auth/token/token"));
const history_middlewares_1 = __importDefault(require("../../history/middlewares/history.middlewares"));
const code_middlewares_1 = __importDefault(require("../../codes/middlewares/code.middlewares"));
const password_middlewares_1 = __importDefault(require("../middlewares/password.middlewares"));
const password_controllers_1 = __importDefault(require("../controllers/password.controllers"));
const router = (0, express_1.Router)();
router.post('/change');
router.post('/password_request', password_middlewares_1.default.allowChange, // Set allow_password_change on true
code_middlewares_1.default.sendCode, // Send the code and set request
history_middlewares_1.default.saveHistory('password change request'), // Save history
token_1.default.generateToken // Generate token
);
router.post('/change_password', token_1.default.verifyToken, // Verify token and extract email
code_middlewares_1.default.checkCode, // Validate there is not a previously code
password_middlewares_1.default.checkAllow, // Check if change password is allowed
password_middlewares_1.default.passwordComplexity, // Verify password complexity and set request
password_middlewares_1.default.comparePassword, // Compare new password with old password
history_middlewares_1.default.saveHistory('password changed'), // Save history
password_controllers_1.default.changePassword // Change password
);
exports.default = router;
