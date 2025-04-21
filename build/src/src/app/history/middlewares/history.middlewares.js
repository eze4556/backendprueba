"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const history_models_1 = __importDefault(require("../../users/models/history.models"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
class HistoryMiddleware {
    /**
     * Save a history log
     * @param log
     * @returns
     */
    saveHistory(log) {
        return async (req, res, next) => {
            try {
                const { email } = req; // Extract email
                const historySession = new history_models_1.default({
                    email,
                    log,
                });
                await historySession.save(); // Save new log in history
                next(); // next to generate token
            }
            catch (e) {
                return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                    message: 'Internal Error',
                    data: { error: e.message },
                });
            }
        };
    }
}
exports.default = new HistoryMiddleware();
