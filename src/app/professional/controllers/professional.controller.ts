import { Request, Response } from 'express';
import Professional from '../models/professional.models';
import cors from 'cors';
import mongoose from 'mongoose';

interface ProfessionalType {
  name: string;
  profession: string;
  experience: number;
  score: number;
  categorie: string;
}
import { rankItems } from '../../ranking/ranking.utils';
import { Item } from '../../ranking/ranking.types';

// Crear un nuevo profesional
export const crearProfesional = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, profession, experience, score, categorie } = req.body;
    
    // Validación de campos requeridos
    if (!name || !profession) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: name and profession are required' 
      });
    }
    
    const newProfessional = new Professional({ 
      name, 
      profession, 
      experience: experience || 0,  
      score: score || 0, 
      categorie 
    });
    
    await newProfessional.save();
    
    return res.status(201).json({
      success: true,
      message: 'Professional created successfully',
      data: newProfessional
    });
  } catch (error: any) {
    console.error('Error creating professional:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Validation error',
        details: error.message 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Error al crear el profesional', 
      error: error.message 
    });
  }
};

// Obtener todos los profesionales
export const obtenerProfesionales = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('🔍 Buscando profesionales en la base de datos...');
    const professionals = await Professional.find();
    console.log(`📊 Encontrados ${professionals.length} profesionales`);
    
    if (professionals.length === 0) {
      console.log('⚠️  No se encontraron profesionales');
      return res.status(200).json([]);
    }

    // Devolver los datos directamente sin ranking por ahora
    console.log('✅ Devolviendo profesionales:', professionals.map(p => p.name));
    return res.status(200).json(professionals);
  } catch (error) {
    console.error('❌ Error al obtener profesionales:', error);
    return res.status(500).json({ message: 'Error al obtener los profesionales', error });
  }
};

// Obtener un profesional por ID
export const getProfessionalById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const professional = await Professional.findById(id);
    if (!professional) {
      return res.status(404).json({ message: 'Profesional no encontrado' });
    }
    return res.status(200).json(professional);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener el profesional', error });
  }
};

// Actualizar un profesional
export const actualizarProfesional = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name, profession, experience, score, categorie } = req.body;
    const updatedProfessional = await Professional.findByIdAndUpdate(id, { name, profession, experience, score, categorie }, { new: true });
    if (!updatedProfessional) {
      return res.status(404).json({ message: 'Profesional no encontrado' });
    }
    return res.status(200).json(updatedProfessional);
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar el profesional', error });
  }
};

// Eliminar un profesional
export const eliminarProfesional = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deletedProfessional = await Professional.findByIdAndDelete(id);
    if (!deletedProfessional) {
      return res.status(404).json({ message: 'Profesional no encontrado' });
    }
    return res.status(200).json({ message: 'Profesional eliminado' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar el profesional', error });
  }
};

// Obtener profesionales por categoría
export const obtenerProfesionalesPorCategoria = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { categoria } = req.params;
    const professionals = await Professional.find({ categoria });
    if (professionals.length === 0) {
      return res.status(404).json({ message: 'No se encontraron profesionales para esta categoría' });
    }
    return res.status(200).json(professionals);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener los profesionales por categoría', error });
  }
};