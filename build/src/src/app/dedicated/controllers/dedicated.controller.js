"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerDedicatedsPorCategoria = exports.eliminarDedicated = exports.actualizarDedicated = exports.getDedicatedById = exports.obtenerDedicatedRanking = exports.crearDedicated = exports.obtenerDedicateds = void 0;
const dedicated_models_1 = __importDefault(require("../models/dedicated.models"));
const ranking_utils_1 = require("../../ranking/ranking.utils");
// Método GET para obtener todos los dedicated
const obtenerDedicateds = async (req, res, next) => {
    try {
        const dedicateds = await dedicated_models_1.default.find();
        // Supongamos que cada dedicated tiene un campo `score`
        const items = dedicateds.map(d => ({
            name: d.name,
            score: d.score,
            categorie: d.categorie
        }));
        const rankedItems = (0, ranking_utils_1.rankItems)(items);
        res.json(rankedItems);
    }
    catch (err) {
        next(err);
    }
};
exports.obtenerDedicateds = obtenerDedicateds;
// Método POST para crear un nuevo dedicated
const crearDedicated = async (req, res, next) => {
    try {
        const dedicated = new dedicated_models_1.default({
            name: req.body.name,
            profession: req.body.profession,
            experience: req.body.experience,
            score: req.body.score,
            categorie: req.body.categorie
        });
        const newDedicated = await dedicated.save();
        res.status(201).json(newDedicated);
    }
    catch (err) {
        next(err);
    }
};
exports.crearDedicated = crearDedicated;
// Método para obtener el ranking de los dedicated
const obtenerDedicatedRanking = async (req, res, next) => {
    try {
        const dedicateds = await dedicated_models_1.default.find();
        // Supongamos que cada dedicated tiene un campo `score`
        const items = dedicateds.map(d => ({
            name: d.name,
            score: d.score,
            categorie: d.categorie
        }));
        const rankedItems = (0, ranking_utils_1.rankItems)(items);
        res.json(rankedItems);
    }
    catch (err) {
        console.error('Error en obtenerDedicatedRanking:', err);
        next(err);
    }
};
exports.obtenerDedicatedRanking = obtenerDedicatedRanking;
// Método GET para obtener un dedicated por ID
const getDedicatedById = async (req, res, next) => {
    try {
        const dedicated = await dedicated_models_1.default.findById(req.params.id);
        if (!dedicated) {
            return res.status(404).json({ message: 'Dedicated no encontrado' });
        }
        res.status(200).json(dedicated);
    }
    catch (err) {
        next(err);
    }
};
exports.getDedicatedById = getDedicatedById;
// Actualizar un dedicated
const actualizarDedicated = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, profession, experience, score, categorie } = req.body;
        const updatedDedicated = await dedicated_models_1.default.findByIdAndUpdate(id, { name, profession, experience, score, categorie }, { new: true });
        if (!updatedDedicated) {
            return res.status(404).json({ message: 'Dedicated no encontrado' });
        }
        return res.status(200).json(updatedDedicated);
    }
    catch (err) {
        next(err);
    }
};
exports.actualizarDedicated = actualizarDedicated;
// Eliminar un dedicated
const eliminarDedicated = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedDedicated = await dedicated_models_1.default.findByIdAndDelete(id);
        if (!deletedDedicated) {
            return res.status(404).json({ message: 'Dedicated no encontrado' });
        }
        return res.status(200).json({ message: 'Dedicated eliminado' });
    }
    catch (err) {
        next(err);
    }
};
exports.eliminarDedicated = eliminarDedicated;
// Obtener dedicateds por categoría
const obtenerDedicatedsPorCategoria = async (req, res, next) => {
    try {
        const { categoria } = req.params;
        const dedicateds = await dedicated_models_1.default.find({ categoria });
        if (dedicateds.length === 0) {
            return res.status(404).json({ message: 'No se encontraron dedicateds para esta categoría' });
        }
        return res.status(200).json(dedicateds);
    }
    catch (err) {
        next(err);
    }
};
exports.obtenerDedicatedsPorCategoria = obtenerDedicatedsPorCategoria;
