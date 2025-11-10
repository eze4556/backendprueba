"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const environments_1 = require("../environments/environments");
const user_models_1 = __importDefault(require("../app/users/models/user.models"));
beforeAll(async () => {
    const env = (0, environments_1.environment)();
    await mongoose_1.default.connect(env.MONGO_DB_URI);
});
afterAll(async () => {
    await mongoose_1.default.connection.close();
});
// Asegurarse de que los modelos necesarios estén registrados
beforeEach(() => {
    if (!mongoose_1.default.models.users) {
        mongoose_1.default.model('users', user_models_1.default.schema);
    }
});
//# sourceMappingURL=setup.js.map