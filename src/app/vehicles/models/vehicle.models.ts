import mongoose, { Schema } from 'mongoose';

export interface IVehicle extends mongoose.Document {
  type: string;
  brand: string;
  vehicleModel: string;
  year: number;
  licensePlate: string;
  color: string;
  kilometers: number;
  blueCard: string;
  images: string[];
  driverStatus?: boolean; // Añadido para el estado del conductor
}

const vehicleSchema = new Schema({
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
});

const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);

export default Vehicle;

// Función para consultar vehículos por tipo
export const getVehiclesByType = async (type: string) => {
  try {
    const vehicles = await Vehicle.find({ type });
    return vehicles;
  } catch (error: any) {
      throw new Error(`Error al obtener vehículos: ${(error as Error).message}`);
    }
  }