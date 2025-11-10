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
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Invalid code, expirated token or user not exist'
                });
            }
            req.expiresIn = '1h'; // Send expiration time 1h;
            next(); // Continue to Generate Token
        }
        catch (e) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: e.message
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
                console.log('sendCode middleware - email is missing');
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Email is required'
                });
            }
            console.log('sendCode middleware - checking for existing codes...');
            // Find previous codes and check expiration
            const codeResult = await code_models_1.default.findOne({
                $and: [{ email }, { expiration: { $gte: new Date() } }],
            });
            console.log('sendCode middleware - existing code result:', codeResult);
            if (codeResult) {
                console.log('sendCode middleware - previous code found, rejecting request');
                // Prevent another request before the expiration time is reached
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Previous unvalidated code'
                });
            }
            console.log('sendCode middleware - generating new code...');
            const randomCode = code_tools_1.default.generateCode(); // generate random code;
            console.log('sendCode middleware - generated code:', randomCode);
            console.log('sendCode middleware - creating code model...');
            // save the code on mongo and set expiration time
            const code = new code_models_1.default({
                email,
                code: randomCode,
                expiration: (0, moment_1.default)().add(5, 'minutes').toDate(), // Expiration time in 5min,
            });
            console.log('sendCode middleware - saving code to database...');
            await code.save();
            console.log('sendCode middleware - code saved successfully');
            req.expiresIn = '5m';
            console.log('sendCode middleware - calling next()');
            next();
        }
        catch (e) {
            console.error('sendCode middleware - error:', e);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: e.message
            });
        }
    }
    async checkCode(req, res, next) {
        var _a;
        try {
            const { code, email } = req.body;
            console.log('checkCode middleware - email received:', email);
            console.log('checkCode middleware - code received:', code);
            if (!email || !code) {
                console.log('checkCode middleware - missing email or code');
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Email and code are required'
                });
            }
            console.log('checkCode middleware - checking code in database...');
            // Buscar el código sin restricción de expiración primero
            const codeCheck = await code_models_1.default.findOne({
                $and: [
                    { email },
                    { code }
                ],
            });
            console.log('checkCode middleware - code found (any expiration):', codeCheck ? 'YES' : 'NO');
            if (codeCheck) {
                console.log('checkCode middleware - code details:', {
                    email: codeCheck.email,
                    code: codeCheck.code,
                    expiration: codeCheck.expiration,
                    now: new Date(),
                    isExpired: codeCheck.expiration < new Date()
                });
            }
            // Buscar códigos válidos (no expirados) para este email
            const validCodes = await code_models_1.default.find({
                $and: [
                    { email },
                    { expiration: { $gte: new Date() } }
                ],
            });
            console.log('checkCode middleware - valid codes for email:', validCodes.map(c => c.code));
            // Ahora buscar y eliminar el código válido
            const codeResult = await code_models_1.default.findOneAndDelete({
                $and: [
                    { email },
                    { code },
                    { expiration: { $gte: new Date() } }
                ],
            });
            console.log('checkCode middleware - code result:', codeResult ? 'FOUND' : 'NOT FOUND');
            if (!codeResult) {
                console.log('checkCode middleware - invalid code, sending error');
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Invalid code, expired code or user not exist'
                });
            }
            console.log('checkCode middleware - code validated successfully');
            // Set email and password in request for the controller
            req.email = email;
            req.password = (_a = req.body.auth_data) === null || _a === void 0 ? void 0 : _a.password;
            next();
        }
        catch (e) {
            console.error('checkCode middleware - error:', e);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: e.message
            });
        }
    }
}
exports.default = new CodeMiddleware();
//# sourceMappingURL=code.middlewares.js.map