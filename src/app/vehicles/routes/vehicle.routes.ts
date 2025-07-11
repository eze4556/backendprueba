import express from 'express';
import cors from 'cors';
import multer from 'multer';
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
router.post('/vehicles', upload.array('images', 3), createVehicle);

// Obtener un vehículo por ID
router.get('/vehicles/:id', getVehicleById);

// Actualizar un vehículo por ID
router.put('/vehicles/:id', upload.array('images', 3), updateVehicleById);

// Eliminar un vehículo por ID
router.delete('/vehicles/:id', deleteVehicleById);

// Nueva ruta para actualizar el estado del conductor
router.patch('/vehicles/:id/driver-status', setDriverStatus);

export default router;