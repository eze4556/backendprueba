"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerProfesionalesPorCategoria = exports.eliminarProfesional = exports.actualizarProfesional = exports.getProfessionalById = exports.obtenerProfesionales = exports.crearProfesional = void 0;
const professional_models_1 = __importDefault(require("../models/professional.models"));
const ranking_utils_1 = require("../../ranking/ranking.utils");
// Crear un nuevo profesional
const crearProfesional = async (req, res) => {
    try {
        const { name, profession, experience, score, categorie } = req.body;
        const newProfessional = new professional_models_1.default({ name, profession, experience, score, categorie });
        await newProfessional.save();
        return res.status(201).json(newProfessional);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al crear el profesional', error });
    }
};
exports.crearProfesional = crearProfesional;
// Obtener todos los profesionales
const obtenerProfesionales = async (req, res) => {
    try {
        const professionals = await professional_models_1.default.find();
        // Supongamos que cada profesional tiene un campo `score`
        const items = professionals.map((p) => ({
            name: p.name,
            score: p.score,
            categorie: p.categorie
        }));
        const rankedItems = (0, ranking_utils_1.rankItems)(items);
        return res.status(200).json(rankedItems);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener los profesionales', error });
    }
};
exports.obtenerProfesionales = obtenerProfesionales;
// Obtener un profesional por ID
const getProfessionalById = async (req, res) => {
    try {
        const { id } = req.params;
        const professional = await professional_models_1.default.findById(id);
        if (!professional) {
            return res.status(404).json({ message: 'Profesional no encontrado' });
        }
        return res.status(200).json(professional);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener el profesional', error });
    }
};
exports.getProfessionalById = getProfessionalById;
// Actualizar un profesional
const actualizarProfesional = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, profession, experience, score, categorie } = req.body;
        const updatedProfessional = await professional_models_1.default.findByIdAndUpdate(id, { name, profession, experience, score, categorie }, { new: true });
        if (!updatedProfessional) {
            return res.status(404).json({ message: 'Profesional no encontrado' });
        }
        return res.status(200).json(updatedProfessional);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al actualizar el profesional', error });
    }
};
exports.actualizarProfesional = actualizarProfesional;
// Eliminar un profesional
const eliminarProfesional = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProfessional = await professional_models_1.default.findByIdAndDelete(id);
        if (!deletedProfessional) {
            return res.status(404).json({ message: 'Profesional no encontrado' });
        }
        return res.status(200).json({ message: 'Profesional eliminado' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el profesional', error });
    }
};
exports.eliminarProfesional = eliminarProfesional;
// Obtener profesionales por categoría
const obtenerProfesionalesPorCategoria = async (req, res) => {
    try {
        const { categoria } = req.params;
        const professionals = await professional_models_1.default.find({ categoria });
        if (professionals.length === 0) {
            return res.status(404).json({ message: 'No se encontraron profesionales para esta categoría' });
        }
        return res.status(200).json(professionals);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error al obtener los profesionales por categoría', error });
    }
};
exports.obtenerProfesionalesPorCategoria = obtenerProfesionalesPorCategoria;
