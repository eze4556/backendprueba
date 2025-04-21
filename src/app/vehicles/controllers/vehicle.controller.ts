import { Request, Response } from 'express';
import Vehicle from '../models/vehicle.models';
import multer from 'multer';

// Configurar Multer
const upload = multer({ dest: 'uploads/' });

export const getAllVehicles = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    let query = type ? { type: String(type) } : {};
    const vehicles = await Vehicle.find(query);
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { vehicleModel, brand, licensePlate, color, kilometers, blueCard, type, year } = req.body;
    const images = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

    const newVehicle = new Vehicle({
      vehicleModel, brand, licensePlate, color, kilometers, blueCard, type, year, images
    });

    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
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
