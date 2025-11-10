"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const categorie_models_1 = __importDefault(require("../models/categorie.models"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
class CategorieController {
    /**
     * Change password
     * @param req
     * @param res
     * @returns
     */
    async getData(req, res) {
        try {
            const categories = await categorie_models_1.default.find({});
            return handler_helper_1.default.success(res, { message: 'Response successfully', data: { categories } });
        }
        catch (e) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: e.message
            });
        }
    }
}
exports.default = new CategorieController();
//# sourceMappingURL=categorie.controllers.js.map