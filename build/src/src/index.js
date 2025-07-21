"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const chalk = require('chalk');
app_1.default.listen(app_1.default.get('port'), () => {
    console.log(`Server on port ${chalk.greenBright(app_1.default.get('port'))} ✔`);
});
// Archivo de barril para exportar todos los middlewares
__exportStar(require("./middleware/auth.middleware"), exports);
__exportStar(require("./middleware/error.middleware"), exports);
__exportStar(require("./middleware/logger.middleware"), exports);
__exportStar(require("./middleware/validator.middleware"), exports);
