"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const password_tools_1 = __importDefault(require("../../../tools/password.tools"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const user_models_1 = __importDefault(require("../models/user.models"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
class PasswordMiddleware {
    /**
     * Check password complexity
     * @param req
     * @param res
     * @param next
     * @returns
     */
    async passwordComplexity(req, res, next) {
        try {
            const { password } = req.body.auth_data || req.body; // Extract password
            // Check password complexity
            if (!password_tools_1.default.validatePassword(password)) {
                return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                    message: 'Bad request error',
                    data: {
                        error: 'Incorrect format. (Minimum 8 characters, uppercase, lowercase, at least 2 numbers and must not contain blank spaces)',
                    },
                });
            }
            req.password = password; // Set password
            next();
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
    /**
     * Compare new password with stored password
     * @param req
     * @param res
     * @param next
     * @returns
     */
    async comparePassword(req, res, next) {
        try {
            const { _id } = req; // Extract _id from token
            const { password } = req.body; // Extract new password from body
            const oldPassword = await user_models_1.default.findById({ _id }).then((user) => {
                return user === null || user === void 0 ? void 0 : user.auth_data.password; // Find old user password
            });
            const samePassword = bcrypt_1.default.compareSync(password, oldPassword); // Compare old password with new password
            if (samePassword) {
                // If is the same password return error
                return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                    message: 'Bad request error',
                    data: { error: 'Wrong password' },
                });
            }
            const hashedPassword = await bcrypt_1.default.hash(password, 10); // Hash and set the password in auth_data
            req.password = hashedPassword; // Set on request the new password
            next();
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
    /**
     * Set allow password change on true
     * @param req
     * @param res
     * @param next
     * @returns
     */
    async allowChange(req, res, next) {
        try {
            const { email } = req.body; // Extract _id from token
            const user = await user_models_1.default.findOneAndUpdate({ 'primary_data.email': email }, { $set: { 'permissions.allow_password_change': true } } // Set flag on true
            );
            req.email = email; // Save email for token
            req._id = user._id; // Save _id for token
            next();
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
    /**
     * Check if user can change the password
     * @param req
     * @param res
     * @param next
     * @returns
     */
    async checkAllow(req, res, next) {
        try {
            const { _id } = req; // Extract _id from token
            const user = await user_models_1.default.findOneAndUpdate({ $and: [{ _id }, { 'permissions.allow_password_change': true }] }, { $set: { 'permissions.allow_password_change': false } }); // Check if user is allowed to change password and set false
            if (!user) {
                // If user is not allowed
                return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                    message: 'Bad request error',
                    data: { error: "Can't change password'" },
                });
            }
            next();
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
}
exports.default = new PasswordMiddleware();
