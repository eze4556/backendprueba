"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const ranking_utils_1 = require("../ranking.utils");
const ranking_controller_1 = require("../controllers/ranking.controller");
const router = (0, express_1.Router)();
// Rutas p�blicas para obtener vendedores por ID
router.get('/professional/:id', ranking_controller_1.getProfessionalById);
router.get('/autonomous/:id', ranking_controller_1.getAutonomousById);
router.get('/dedicated/:id', ranking_controller_1.getDedicatedById);
// Rutas p�blicas para ranking
router.get('/professionals', ranking_controller_1.getProfessionalsRanking);
router.get('/autonomous', ranking_controller_1.getAutonomousRanking);
router.get('/dedicated', ranking_controller_1.getDedicatedRanking);
router.post('/', (req, res) => {
    const { name, score, categorie } = req.body;
    res.status(201).json({ message: 'Ranking creado', data: { name, score, categorie } });
});
const getRankings = async () => {
    const db = mongoose_1.default.connection.db;
    const autonomous = await db.collection('autonomous').find({ verified: true }).toArray();
    const dedicated = await db.collection('dedicated').find({ verified: true }).toArray();
    const professional = await db.collection('professionals').find({ verified: true }).toArray();
    const items = [
        ...autonomous.map((a) => ({
            id: a._id.toString(),
            name: a.name,
            score: a.score || 0,
            categorie: a.category || 'General',
            type: 'autonomous'
        })),
        ...dedicated.map((d) => ({
            id: d._id.toString(),
            name: d.name,
            score: d.score || 0,
            categorie: d.category || 'General',
            type: 'dedicated'
        })),
        ...professional.map((p) => ({
            id: p._id.toString(),
            name: p.name,
            score: p.score || 0,
            categorie: p.category || 'General',
            type: 'professional'
        }))
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
//# sourceMappingURL=ranking.routes.js.map