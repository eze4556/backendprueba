"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const chalk_1 = __importDefault(require("chalk"));
const environments_1 = require("../environments/environments");
const { MONGO_DB_URI } = (0, environments_1.environment)();
mongoose_1.default
    .connect(MONGO_DB_URI.toString())
    .then(() => {
    console.log(`Working on ${chalk_1.default.greenBright('local')} ✔`);
    console.log(`${chalk_1.default.bgRed('Launched... ')} 🚀`);
})
    .catch((err) => {
    console.log(err);
});
