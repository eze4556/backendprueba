"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
// Importa la aplicación principal de Express
const app_1 = __importDefault(require("./app"));
const chalk = require('chalk');
// Inicia el servidor en el puerto configurado y muestra un mensaje en consola
app_1.default.listen(app_1.default.get('port'), () => {
    console.log(`Server on port ${chalk.greenBright(app_1.default.get('port'))} ✔`);
});
//# sourceMappingURL=index.js.map