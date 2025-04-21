"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categorie_controllers_1 = __importDefault(require("../controllers/categorie.controllers"));
const router = (0, express_1.Router)();
router.post('/get_data', categorie_controllers_1.default.getData);
exports.default = router;
