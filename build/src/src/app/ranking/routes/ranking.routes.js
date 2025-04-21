"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autonomous_models_1 = __importDefault(require("../../autonomous/models/autonomous.models"));
const dedicated_models_1 = __importDefault(require("../../dedicated/models/dedicated.models"));
const professional_models_1 = __importDefault(require("../../professional/models/professional.models"));
const ranking_utils_1 = require("../ranking.utils");
const router = (0, express_1.Router)();
router.post('/', (req, res) => {
    const { name, score, categorie } = req.body;
    // Lógica para manejar los datos recibidos
    res.status(201).json({ message: 'Ranking creado', data: { name, score, categorie } });
});
const getRankings = async () => {
    const autonomous = await autonomous_models_1.default.find();
    const dedicated = await dedicated_models_1.default.find();
    const professional = await professional_models_1.default.find();
    const items = [
        ...autonomous.map(a => ({ name: a.name, score: a.score, categorie: a.categorie })),
        ...dedicated.map((d) => ({ name: d.name, score: d.score, categorie: d.categorie })),
        ...professional.map((p) => ({ name: p.name, score: p.score, categorie: p.categorie }))
    ];
    return (0, ranking_utils_1.rankItems)(items);
};
router.get('/', async (req, res, next) => {
    try {
        const rankedItems = await getRankings();
        res.json(rankedItems);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
