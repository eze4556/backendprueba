"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDedicatedById = exports.getAutonomousById = exports.getProfessionalById = exports.getDedicatedRanking = exports.getAutonomousRanking = exports.getProfessionalsRanking = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * GET /api/ranking/professionals
 * Obtener profesionales ordenados por score para ranking
 */
const getProfessionalsRanking = async (req, res) => {
    try {
        const db = mongoose_1.default.connection.db;
        const professionals = await db.collection('professionals')
            .find({
            verified: true,
            score: { $exists: true }
        })
            .sort({ score: -1 })
            .limit(20)
            .toArray();
        res.json({
            success: true,
            count: professionals.length,
            data: professionals
        });
    }
    catch (error) {
        console.error('Error en getProfessionalsRanking:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener profesionales',
            error: error.message
        });
    }
};
exports.getProfessionalsRanking = getProfessionalsRanking;
/**
 * GET /api/ranking/autonomous
 * Obtener autónomos ordenados por score para ranking
 */
const getAutonomousRanking = async (req, res) => {
    try {
        const db = mongoose_1.default.connection.db;
        const autonomous = await db.collection('autonomous')
            .find({
            verified: true,
            score: { $exists: true }
        })
            .sort({ score: -1 })
            .limit(20)
            .toArray();
        res.json({
            success: true,
            count: autonomous.length,
            data: autonomous
        });
    }
    catch (error) {
        console.error('Error en getAutonomousRanking:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener autónomos',
            error: error.message
        });
    }
};
exports.getAutonomousRanking = getAutonomousRanking;
/**
 * GET /api/ranking/dedicated
 * Obtener dedicados ordenados por score para ranking
 */
const getDedicatedRanking = async (req, res) => {
    try {
        const db = mongoose_1.default.connection.db;
        const dedicated = await db.collection('dedicated')
            .find({
            verified: true,
            score: { $exists: true }
        })
            .sort({ score: -1 })
            .limit(20)
            .toArray();
        res.json({
            success: true,
            count: dedicated.length,
            data: dedicated
        });
    }
    catch (error) {
        console.error('Error en getDedicatedRanking:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener dedicados',
            error: error.message
        });
    }
};
exports.getDedicatedRanking = getDedicatedRanking;
/**
 * GET /api/ranking/professional/:id
 * Obtener un profesional por ID
 */
const getProfessionalById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = mongoose_1.default.connection.db;
        const { ObjectId } = require('mongodb');
        const professional = await db.collection('professionals')
            .findOne({ _id: new ObjectId(id) });
        if (!professional) {
            res.status(404).json({
                success: false,
                message: 'Profesional no encontrado'
            });
            return;
        }
        res.json(professional);
    }
    catch (error) {
        console.error('Error en getProfessionalById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener profesional',
            error: error.message
        });
    }
};
exports.getProfessionalById = getProfessionalById;
/**
 * GET /api/ranking/autonomous/:id
 * Obtener un autónomo por ID
 */
const getAutonomousById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = mongoose_1.default.connection.db;
        const { ObjectId } = require('mongodb');
        const autonomous = await db.collection('autonomous')
            .findOne({ _id: new ObjectId(id) });
        if (!autonomous) {
            res.status(404).json({
                success: false,
                message: 'Autónomo no encontrado'
            });
            return;
        }
        res.json(autonomous);
    }
    catch (error) {
        console.error('Error en getAutonomousById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener autónomo',
            error: error.message
        });
    }
};
exports.getAutonomousById = getAutonomousById;
/**
 * GET /api/ranking/dedicated/:id
 * Obtener un dedicado por ID
 */
const getDedicatedById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = mongoose_1.default.connection.db;
        const { ObjectId } = require('mongodb');
        const dedicated = await db.collection('dedicated')
            .findOne({ _id: new ObjectId(id) });
        if (!dedicated) {
            res.status(404).json({
                success: false,
                message: 'Dedicado no encontrado'
            });
            return;
        }
        res.json(dedicated);
    }
    catch (error) {
        console.error('Error en getDedicatedById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener dedicado',
            error: error.message
        });
    }
};
exports.getDedicatedById = getDedicatedById;
//# sourceMappingURL=ranking.controller.js.map