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
    const newProfessional = new Professional({ name, profession, experience, score, categorie });
    await newProfessional.save();
    return res.status(201).json(newProfessional);
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear el profesional', error });
  }
};

// Obtener todos los profesionales
export const obtenerProfesionales = async (req: Request, res: Response): Promise<Response> => {
  try {
    const professionals = await Professional.find();
    
    // Supongamos que cada profesional tiene un campo `score`
    const items: Item[] = professionals.map((p: ProfessionalType) => ({
        name: p.name,
        score: p.score,
        categorie: p.categorie
    }));

    const rankedItems = rankItems(items);

    return res.status(200).json(rankedItems);
  } catch (error) {
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