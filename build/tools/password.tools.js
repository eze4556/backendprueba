"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const password_validator_1 = __importDefault(require("password-validator"));
class PasswordTool {
    /**
     * Validate password
     * @param password
     * @returns
     */
    validatePassword(password) {
        const result = new password_validator_1.default()
            .is()
            .min(8) // Minimum length 8
            .is()
            .max(100) // Maximum length 100
            .has()
            .uppercase() // Must have uppercase letters
            .has()
            .lowercase() // Must have lowercase letters
            .has()
            .digits(2) // Must have at least 2 digits
            .has()
            .not()
            .spaces() // Should not have spaces
            .is()
            .not()
            .oneOf(['Passw0rd', 'Password123']); // Black list
        return result.validate(password) ? true : false;
    }
}
exports.default = new PasswordTool();
//# sourceMappingURL=password.tools.js.map