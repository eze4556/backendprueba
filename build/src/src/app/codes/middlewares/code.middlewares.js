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
            const { email } = req; // Extract email from body or token;
            // Find previous codes and check expiration
            const codeResult = await code_models_1.default.findOne({
                $and: [{ email }, { expiration: { $gte: new Date().getTime() } }],
            });
            if (codeResult) {
                // Prevent another request before the expiration time is reached
                return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                    message: 'Bad request error',
                    data: { error: 'Previous unvalidated code' },
                });
            }
            const randomCode = code_tools_1.default.generateCode(); // generate random code;
            // save the code on mongo and set expiration time
            const code = new code_models_1.default({
                email,
                code: randomCode,
                expiration: (0, moment_1.default)().add(5, 'minutes'), // Expiration time in 5min,
            });
            await code.save();
            req.expiresIn = '5m';
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
     * Check a code not exist
     * @param req
     * @param res
     * @param next
     * @returns
     */
    async checkCode(req, res, next) {
        try {
            const { email } = req; // Extract email from token
            const codeExist = await code_models_1.default.findOne({ email });
            if (codeExist) {
                return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                    message: 'Bad request error',
                    data: { error: 'Previous unvalidated code' },
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
exports.default = new CodeMiddleware();
