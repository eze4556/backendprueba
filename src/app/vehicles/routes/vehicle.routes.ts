import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Token from '../../../auth/token/token';
import {
  getAllVehicles,
  createVehicle,
  getVehicleById,
  updateVehicleById,
  deleteVehicleById,
  setDriverStatus // Importa la función
} from '../controllers/vehicle.controller';

const router = express.Router();

// Configurar CORS
router.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

// Configurar Multer
const upload = multer({ dest: 'uploads/' });

// Obtener todos los vehículos
router.get('/vehicles', getAllVehicles);

// Crear un nuevo vehículo
router.post('/vehicles', Token.verifyToken, upload.array('images', 3), createVehicle);

// Obtener un vehículo por ID
router.get('/vehicles/:id', Token.verifyToken, getVehicleById);

// Actualizar un vehículo por ID
router.put('/vehicles/:id', Token.verifyToken, upload.array('images', 3), updateVehicleById);

// Eliminar un vehículo por ID
router.delete('/vehicles/:id', Token.verifyToken, deleteVehicleById);

// Nueva ruta para actualizar el estado del conductor
router.patch('/vehicles/:id/driver-status', Token.verifyToken, setDriverStatus);

// Nueva ruta para actualizar el estado del conductor
router.patch('/vehicles/:id/driver-status', setDriverStatus);

export default router;