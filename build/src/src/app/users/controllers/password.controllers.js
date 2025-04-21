"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_models_1 = __importDefault(require("../models/user.models"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
class PasswordController {
    /**
     * Change password
     * @param req
     * @param res
     * @returns
     */
    async changePassword(req, res) {
        try {
            const { _id, password } = req;
            await user_models_1.default.findByIdAndUpdate({ _id }, { $set: { 'auth_data.password': password } });
            return handler_helper_1.default.response(res, codes_constanst_1.SUCCESS, { message: 'Password reset successfully', data: { _id } });
        }
        catch (e) {
            return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                message: 'Internal Error',
                data: { error: e.message },
            });
        }
    }
}
exports.default = new PasswordController();
