"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
// Routes
const users_routes_1 = __importDefault(require("./app/users/routes/users.routes"));
const code_routes_1 = __importDefault(require("./app/codes/routes/code.routes"));
const login_routes_1 = __importDefault(require("./app/users/routes/login.routes"));
const password_routes_1 = __importDefault(require("./app/users/routes/password.routes"));
const categorie_routes_1 = __importDefault(require("./app/categories/routes/categorie.routes"));
const media_routes_1 = __importDefault(require("./app/media/routes/media.routes"));
const vehicle_routes_1 = __importDefault(require("./app/vehicles/routes/vehicle.routes"));
const professional_routes_1 = __importDefault(require("./app/professional/routes/professional.routes"));
const productType_routes_1 = __importDefault(require("./app/productTypes/routes/productType.routes"));
const autonomous_routes_1 = __importDefault(require("./app/autonomous/routes/autonomous.routes"));
const dedicated_routes_1 = __importDefault(require("./app/dedicated/routes/dedicated.routes"));
const ranking_routes_1 = __importDefault(require("./app/ranking/routes/ranking.routes"));
const payment_controller_1 = __importDefault(require("./app/payment/payment.controller"));
const calculatorRoutes_1 = __importDefault(require("./app/calculator/routes/calculatorRoutes"));
const subscription_routes_1 = __importDefault(require("./app/subscripcion/routes/subscription.routes"));
const provider_routes_1 = __importDefault(require("./app/proveedores/routes/provider.routes"));
// Database
require("./database/database");
// Settings
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use((0, morgan_1.default)('dev'));
app.set('port', process.env.PORT || 3000);
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
// Routes usage
app.use('/api/code', code_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/login', login_routes_1.default);
app.use('/api/password', password_routes_1.default);
app.use('/api/categorie', categorie_routes_1.default);
app.use('/api/media', media_routes_1.default);
app.use("/api/vehicle", vehicle_routes_1.default);
app.use('/api/professional', professional_routes_1.default);
app.use('/api/productType', productType_routes_1.default);
app.use('/api/autonomous', autonomous_routes_1.default);
app.use('/api/dedicated', dedicated_routes_1.default);
app.use('/api/ranking', ranking_routes_1.default);
app.use('/api/payment', payment_controller_1.default);
app.use('/api/calculator', calculatorRoutes_1.default);
app.use('/api/subscription', subscription_routes_1.default);
app.use('/api/providers', provider_routes_1.default);
exports.default = app;
