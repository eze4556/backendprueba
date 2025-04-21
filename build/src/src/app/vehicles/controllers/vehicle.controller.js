"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicleById = exports.updateVehicleById = exports.getVehicleById = exports.createVehicle = exports.getAllVehicles = void 0;
const vehicle_models_1 = __importDefault(require("../models/vehicle.models"));
const multer_1 = __importDefault(require("multer"));
// Configurar Multer
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const getAllVehicles = async (req, res) => {
    try {
        const { type } = req.query;
        let query = type ? { type: String(type) } : {};
        const vehicles = await vehicle_models_1.default.find(query);
        res.json(vehicles);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getAllVehicles = getAllVehicles;
const createVehicle = async (req, res) => {
    try {
        const { vehicleModel, brand, licensePlate, color, kilometers, blueCard, type, year } = req.body;
        const images = req.files ? req.files.map(file => file.path) : [];
        const newVehicle = new vehicle_models_1.default({
            vehicleModel, brand, licensePlate, color, kilometers, blueCard, type, year, images
        });
        await newVehicle.save();
        res.status(201).json(newVehicle);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createVehicle = createVehicle;
const getVehicleById = async (req, res) => {
    try {
        const vehicle = await vehicle_models_1.default.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        res.json(vehicle);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getVehicleById = getVehicleById;
const updateVehicleById = async (req, res) => {
    try {
        const { vehicleModel, brand, licensePlate, color, kilometers, blueCard, type, year } = req.body;
        const images = req.files ? req.files.map(file => file.path) : [];
        const updatedVehicle = await vehicle_models_1.default.findByIdAndUpdate(req.params.id, { vehicleModel, brand, licensePlate, color, kilometers, blueCard, type, year, images }, { new: true, runValidators: true });
        if (!updatedVehicle) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        res.json(updatedVehicle);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.updateVehicleById = updateVehicleById;
const deleteVehicleById = async (req, res) => {
    try {
        const deletedVehicle = await vehicle_models_1.default.findByIdAndDelete(req.params.id);
        if (!deletedVehicle) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }
        res.json({ message: 'Vehículo eliminado' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.deleteVehicleById = deleteVehicleById;
