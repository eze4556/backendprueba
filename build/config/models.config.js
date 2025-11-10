"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeModels = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_models_1 = __importDefault(require("../app/users/models/user.models"));
const stock_movement_model_1 = require("../app/productTypes/models/stock-movement.model");
const initializeModels = () => {
    // Registrar modelos
    if (!mongoose_1.default.models.users) {
        mongoose_1.default.model('users', user_models_1.default.schema);
    }
    if (!mongoose_1.default.models['stock-movements']) {
        mongoose_1.default.model('stock-movements', stock_movement_model_1.StockMovement.schema);
    }
};
exports.initializeModels = initializeModels;
exports.default = exports.initializeModels;
//# sourceMappingURL=models.config.js.map