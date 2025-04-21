"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAutonomousByCategory = exports.deleteAutonomous = exports.updateAutonomous = exports.getAutonomousById = exports.getAutonomousRanking = exports.createAutonomous = exports.getAllAutonomous = void 0;
const autonomous_models_1 = __importDefault(require("../models/autonomous.models"));
const ranking_utils_1 = require("../../ranking/ranking.utils");
// Método GET para obtener todos los autónomos
const getAllAutonomous = async (req, res, next) => {
    try {
        const autonomous = await autonomous_models_1.default.find();
        // Supongamos que cada autónomo tiene un campo `score`
        const items = autonomous.map(a => ({
            name: a.name,
            score: a.score,
            categorie: a.categorie
        }));
        const rankedItems = (0, ranking_utils_1.rankItems)(items);
        res.json(rankedItems);
    }
    catch (err) {
        next(err);
    }
};
exports.getAllAutonomous = getAllAutonomous;
// Método POST para crear un nuevo autónomo
const createAutonomous = async (req, res, next) => {
    try {
        const autonomous = new autonomous_models_1.default({
            name: req.body.name,
            description: req.body.description,
            score: req.body.score,
            categorie: req.body.categorie
        });
        const newAutonomous = await autonomous.save();
        res.status(201).json(newAutonomous);
    }
    catch (err) {
        next(err);
    }
};
exports.createAutonomous = createAutonomous;
// Método para obtener el ranking de los autónomos
const getAutonomousRanking = async (req, res, next) => {
    try {
        const autonomous = await autonomous_models_1.default.find();
        // Supongamos que cada autónomo tiene un campo `score`
        const items = autonomous.map(a => ({
            name: a.name,
            score: a.score,
            categorie: a.categorie
        }));
        const rankedItems = (0, ranking_utils_1.rankItems)(items);
        res.json(rankedItems);
    }
    catch (err) {
        console.error('Error en getAllAutonomous:', err);
        next(err);
    }
};
exports.getAutonomousRanking = getAutonomousRanking;
// Método GET para obtener un autónomo por ID
const getAutonomousById = async (req, res, next) => {
    try {
        const autonomous = await autonomous_models_1.default.findById(req.params.id);
        if (!autonomous) {
            return res.status(404).json({ message: 'Autónomo no encontrado' });
        }
        res.status(200).json(autonomous);
    }
    catch (err) {
        next(err);
    }
};
exports.getAutonomousById = getAutonomousById;
// Actualizar un autónomo
const updateAutonomous = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, score, categorie } = req.body;
        const updatedAutonomous = await autonomous_models_1.default.findByIdAndUpdate(id, { name, description, score, categorie }, { new: true });
        if (!updatedAutonomous) {
            return res.status(404).json({ message: 'Autónomo no encontrado' });
        }
        return res.status(200).json(updatedAutonomous);
    }
    catch (err) {
        next(err);
    }
};
exports.updateAutonomous = updateAutonomous;
// Eliminar un autónomo
const deleteAutonomous = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedAutonomous = await autonomous_models_1.default.findByIdAndDelete(id);
        if (!deletedAutonomous) {
            return res.status(404).json({ message: 'Autónomo no encontrado' });
        }
        return res.status(200).json({ message: 'Autónomo eliminado' });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteAutonomous = deleteAutonomous;
// Obtener autónomos por categoría
const getAutonomousByCategory = async (req, res, next) => {
    try {
        const { categoria } = req.params;
        const autonomous = await autonomous_models_1.default.find({ categoria });
        if (autonomous.length === 0) {
            return res.status(404).json({ message: 'No se encontraron autónomos para esta categoría' });
        }
        return res.status(200).json(autonomous);
    }
    catch (err) {
        next(err);
    }
};
exports.getAutonomousByCategory = getAutonomousByCategory;
