"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehiclesByType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const vehicleSchema = new mongoose_1.Schema({
    vehicleModel: { type: String, required: true },
    brand: { type: String, required: true },
    licensePlate: { type: String, required: true },
    color: { type: String, required: true },
    kilometers: { type: Number, required: true },
    blueCard: { type: String, required: true },
    type: { type: String, required: true },
    year: { type: Number, required: true },
    images: { type: [String], required: false },
    driverStatus: { type: Boolean, default: false }, // Añadido aquí
    assignedDriver: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: false }, // Añadido para la referencia del conductor
});
const Vehicle = mongoose_1.default.model('Vehicle', vehicleSchema);
exports.default = Vehicle;
// Función para consultar vehículos por tipo
const getVehiclesByType = async (type) => {
    try {
        const vehicles = await Vehicle.find({ type });
        return vehicles;
    }
    catch (error) {
        throw new Error(`Error al obtener vehículos: ${error.message}`);
    }
};
exports.getVehiclesByType = getVehiclesByType;
//# sourceMappingURL=vehicle.models.js.map