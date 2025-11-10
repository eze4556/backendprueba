import { Request, Response } from 'express';
import Vehicle from '../models/vehicle.models';
import User from '../../users/models/user.models'; // Importar el modelo User para populate
import multer from 'multer';

// Configurar Multer
const upload = multer({ dest: 'uploads/' });

export const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    let query = type ? { type: String(type) } : {};
    
    // Obtener vehículos
    const vehicles = await Vehicle.find(query);
    
    // Transformar los datos para asegurar compatibilidad con el frontend
    const vehiclesFormatted = vehicles.map(vehicle => ({
      ...vehicle.toObject(),
      // Agregar campos adicionales que el frontend podría estar esperando
      isActive: vehicle.driverStatus,
      active: vehicle.driverStatus,
      status: vehicle.driverStatus ? 'active' : 'inactive',
      available: vehicle.driverStatus,
      hasDriver: !!vehicle.assignedDriver,
      driverAvailable: vehicle.driverStatus
    }));
    
    // Agregar logging detallado para debugging
    console.log('📊 Vehículos encontrados:', vehicles.length);
    if (vehicles.length > 0) {
      console.log('🔍 Primer vehículo formateado para frontend:');
      console.log(JSON.stringify(vehiclesFormatted[0], null, 2));
      
      // Contar vehículos activos/inactivos
      const activeCount = vehicles.filter(v => v.driverStatus === true).length;
      const inactiveCount = vehicles.filter(v => v.driverStatus === false).length;
      console.log(`✅ Activos: ${activeCount}, ❌ Inactivos: ${inactiveCount}`);
      
      // Verificar campos booleanos
      console.log('� Verificación de campos booleanos:');
      console.log(`driverStatus: ${vehiclesFormatted[0].driverStatus}`);
      console.log(`isActive: ${vehiclesFormatted[0].isActive}`);
      console.log(`active: ${vehiclesFormatted[0].active}`);
      console.log(`status: ${vehiclesFormatted[0].status}`);
    }
    
    res.json(vehiclesFormatted);
  } catch (err) {
    console.error('❌ Error al obtener vehículos:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicleModel, brand, licensePlate, color, kilometers, blueCard, type, year } = req.body;
    
    // Validación de campos requeridos
    if (!vehicleModel || !brand || !licensePlate || !type) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: vehicleModel, brand, licensePlate, and type are required' 
      });
    }
    
    const images = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

    const newVehicle = new Vehicle({
      vehicleModel, 
      brand, 
      licensePlate, 
      color, 
      kilometers, 
      blueCard, 
      type, 
      year, 
      images
    });

    await newVehicle.save();
    
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: newVehicle
    });
  } catch (err: any) {
    console.error('❌ Error al crear vehículo:', err);
    
    // Manejar errores de validación de Mongoose
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Validation error',
        details: err.message 
      });
    }
    
    // Manejar duplicados (licensePlate único)
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false,
        error: 'Vehicle with this license plate already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: err.message || 'Error creating vehicle' 
    });
  }
};

export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateVehicleById = async (req: Request, res: Response) => {
  try {
    const { vehicleModel, brand, licensePlate, color, kilometers, blueCard, type, year } = req.body;
    const images = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { vehicleModel, brand, licensePlate, color, kilometers, blueCard, type, year, images },
      { new: true, runValidators: true }
    );

    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    res.json(updatedVehicle);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteVehicleById = async (req: Request, res: Response) => {
  try {
    const deletedVehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deletedVehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }
    res.json({ message: 'Vehículo eliminado' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// Nueva función para actualizar el estado del conductor
export const setDriverStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { driverStatus: isActive },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    res.json({ message: 'Estado del conductor actualizado', vehicle });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el estado', error });
  }
};