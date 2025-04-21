"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const vehicle_controller_1 = require("../controllers/vehicle.controller");
const router = express_1.default.Router();
// Configurar CORS
router.use((0, cors_1.default)({
    origin: 'http://localhost:4200',
    credentials: true
}));
// Configurar Multer
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// Obtener todos los vehículos
router.get('/vehicles', vehicle_controller_1.getAllVehicles);
// Crear un nuevo vehículo
router.post('/vehicles', upload.array('images', 3), vehicle_controller_1.createVehicle);
// Obtener un vehículo por ID
router.get('/vehicles/:id', vehicle_controller_1.getVehicleById);
// Actualizar un vehículo por ID
router.put('/vehicles/:id', upload.array('images', 3), vehicle_controller_1.updateVehicleById);
// Eliminar un vehículo por ID
router.delete('/vehicles/:id', vehicle_controller_1.deleteVehicleById);
exports.default = router;
