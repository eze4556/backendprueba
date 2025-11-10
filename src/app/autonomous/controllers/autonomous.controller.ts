import { Request, Response, NextFunction } from 'express';
import Autonomous from '../models/autonomous.models';
import { rankItems } from '../../ranking/ranking.utils';
import { Item } from '../../ranking/ranking.types';

// Método GET para obtener todos los autónomos
export const getAllAutonomous = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🔍 Buscando autónomos en la base de datos...');
        const autonomous = await Autonomous.find();
        console.log(`📊 Encontrados ${autonomous.length} autónomos`);
        
        if (autonomous.length === 0) {
            console.log('⚠️  No se encontraron autónomos');
            return res.status(200).json([]);
        }

        // Devolver los datos directamente sin ranking por ahora
        console.log('✅ Devolviendo autónomos:', autonomous.map(a => a.name));
        res.json(autonomous);
    } catch (err) {
        console.error('❌ Error al obtener autónomos:', err);
        next(err);
    }
};

// Método POST para crear un nuevo autónomo
export const createAutonomous = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const autonomous = new Autonomous({
            name: req.body.name,
            description: req.body.description,
            score: req.body.score,
            categorie: req.body.categorie
        });
        const newAutonomous = await autonomous.save();
        res.status(201).json(newAutonomous);
    } catch (err) {
        next(err);
    }
};

// Método para obtener el ranking de los autónomos
export const getAutonomousRanking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const autonomous = await Autonomous.find();
        
        // Supongamos que cada autónomo tiene un campo `score`
        const items: Item[] = autonomous.map(a => ({
            name: a.name,
            score: a.score,
            categorie: a.categorie
        }));

        const rankedItems = rankItems(items);

        res.json(rankedItems);
    } catch (err) {
        console.error('Error en getAllAutonomous:', err);
        next(err);
    }
};

// Método GET para obtener un autónomo por ID
export const getAutonomousById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const autonomous = await Autonomous.findById(req.params.id);
        if (!autonomous) {
            return res.status(404).json({ message: 'Autónomo no encontrado' });
        }
        res.status(200).json(autonomous);
    } catch (err) {
        next(err);
    }
};

// Actualizar un autónomo
export const updateAutonomous = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, description, score, categorie } = req.body;
        const updatedAutonomous = await Autonomous.findByIdAndUpdate(id, { name, description, score, categorie }, { new: true });
        if (!updatedAutonomous) {
            return res.status(404).json({ message: 'Autónomo no encontrado' });
        }
        return res.status(200).json(updatedAutonomous);
    } catch (err) {
        next(err);
    }
};

// Eliminar un autónomo
export const deleteAutonomous = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const deletedAutonomous = await Autonomous.findByIdAndDelete(id);
        if (!deletedAutonomous) {
            return res.status(404).json({ message: 'Autónomo no encontrado' });
        }
        return res.status(200).json({ message: 'Autónomo eliminado' });
    } catch (err) {
        next(err);
    }
};

// Obtener autónomos por categoría
export const getAutonomousByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { categoria } = req.params;
        const autonomous = await Autonomous.find({ categoria });
        if (autonomous.length === 0) {
            return res.status(404).json({ message: 'No se encontraron autónomos para esta categoría' });
        }
        return res.status(200).json(autonomous);
    } catch (err) {
        next(err);
    }
};