"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const code_models_1 = __importDefault(require("../models/code.models"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const code_tools_1 = __importDefault(require("../../../tools/code.tools"));
const moment_1 = __importDefault(require("moment"));
class CodeMiddleware {
    /**
     * Validate an existing code
     * @param req
     * @param res
     * @param next
     * @returns
     */
    async validateCode(req, res, next) {
        try {
            const { code } = req.body;
            const { email } = req;
            // Check if exist: email and code, if validated is false, and expiration is lower than Date.now, and set validated in true
            const result = await code_models_1.default.findOneAndDelete({
                $and: [{ email }, { code }],
            });
            if (!result) {
                return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                    message: 'Bad request error',
                    data: { error: 'Invalid code, expirated token or user not exist' },
                });
            }
            req.expiresIn = '1h'; // Send expiration time 1h;
            next(); // Continue to Generate Token
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
    /**
     * Send random code
     * @param req
     * @param res
     * @param next
     * @returns
     */
    async sendCode(req, res, next) {
        try {
            const { email } = req.body;
            console.log('sendCode middleware - email received:', email);
            if (!email) {
                return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                    message: 'Bad request error',
                    data: { error: 'Email is required' },
                });
            }
            // Find previous codes and check expiration
            const codeResult = await code_models_1.default.findOne({
                $and: [{ email }, { expiration: { $gte: new Date() } }],
            });
            if (codeResult) {
                // Prevent another request before the expiration time is reached
                return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                    message: 'Bad request error',
                    data: { error: 'Previous unvalidated code' },
                });
            }
            const randomCode = code_tools_1.default.generateCode(); // generate random code;
            console.log('sendCode middleware - generated code:', randomCode);
            // save the code on mongo and set expiration time
            const code = new code_models_1.default({
                email,
                code: randomCode,
                expiration: (0, moment_1.default)().add(5, 'minutes').toDate(), // Expiration time in 5min,
            });
            await code.save();
            console.log('sendCode middleware - code saved successfully');
            req.expiresIn = '5m';
            next();
        }
        catch (e) {
            console.error('sendCode middleware - error:', e);
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
    async checkCode(req, res, next) {
        var _a;
        try {
            const { code } = req.body;
            const { email } = req;
            // Check if code exists and is not expired
            const codeResult = await code_models_1.default.findOneAndDelete({
                $and: [
                    { email },
                    { code },
                    { expiration: { $gte: new Date() } }
                ],
            });
            if (!codeResult) {
                return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                    message: 'Bad request error',
                    data: { error: 'Invalid code, expired code or user not exist' },
                });
            }
            // Set email and password in request for the controller
            req.email = email;
            req.password = (_a = req.body.auth_data) === null || _a === void 0 ? void 0 : _a.password;
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
exports.default = new CodeMiddleware();
