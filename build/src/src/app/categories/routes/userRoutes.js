"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_models_1 = __importDefault(require("../../users/models/user.models"));
const router = (0, express_1.Router)();
router.post('/users', async (req, res) => {
    try {
        const user = new user_models_1.default(req.body);
        await user.save();
        res.status(201).send(user);
    }
    catch (error) {
        res.status(400).send(error);
    }
});
router.get('/users', async (req, res) => {
    try {
        const status = req.query.status;
        const users = await user_models_1.default.find(status ? { status } : {});
        res.send(users);
    }
    catch (error) {
        res.status(500).send(error);
    }
});
exports.default = router;
