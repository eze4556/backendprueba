import { Request, Response, NextFunction } from 'express';
import Dedicated from '../models/dedicated.models';
import { rankItems } from '../../ranking/ranking.utils';
import { Item } from '../../ranking/ranking.types';

// Método GET para obtener todos los dedicated
export const obtenerDedicateds = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dedicateds = await Dedicated.find();
        
        // Supongamos que cada dedicated tiene un campo `score`
        const items: Item[] = dedicateds.map(d => ({
            name: d.name,
            score: d.score,
            categorie: d.categorie 
        }));

        const rankedItems = rankItems(items);

        res.json(rankedItems);
    } catch (err) {
        next(err);
    }
};

// Método POST para crear un nuevo dedicated
export const crearDedicated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dedicated = new Dedicated({
            name: req.body.name,
            profession: req.body.profession,
            experience: req.body.experience,
            score: req.body.score,
            categorie: req.body.categorie
        });
        const newDedicated = await dedicated.save();
        res.status(201).json(newDedicated);
    } catch (err) {
        next(err);
    }
};

// Método para obtener el ranking de los dedicated
export const obtenerDedicatedRanking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dedicateds = await Dedicated.find();
        
        // Supongamos que cada dedicated tiene un campo `score`
        const items: Item[] = dedicateds.map(d => ({
            name: d.name,
            score: d.score,
            categorie: d.categorie
        }));

        const rankedItems = rankItems(items);

        res.json(rankedItems);
    } catch (err) {
        console.error('Error en obtenerDedicatedRanking:', err);
        next(err);
    }
};

// Método GET para obtener un dedicated por ID
export const getDedicatedById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dedicated = await Dedicated.findById(req.params.id);
        if (!dedicated) {
            return res.status(404).json({ message: 'Dedicated no encontrado' });
        }
        res.status(200).json(dedicated);
    } catch (err) {
        next(err);
    }
};

// Actualizar un dedicated
export const actualizarDedicated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, profession, experience, score, categorie } = req.body;
        const updatedDedicated = await Dedicated.findByIdAndUpdate(id, { name, profession, experience, score, categorie }, { new: true });
        if (!updatedDedicated) {
            return res.status(404).json({ message: 'Dedicated no encontrado' });
        }
        return res.status(200).json(updatedDedicated);
    } catch (err) {
        next(err);
    }
};

// Eliminar un dedicated
export const eliminarDedicated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const deletedDedicated = await Dedicated.findByIdAndDelete(id);
        if (!deletedDedicated) {
            return res.status(404).json({ message: 'Dedicated no encontrado' });
        }
        return res.status(200).json({ message: 'Dedicated eliminado' });
    } catch (err) {
        next(err);
    }
};

// Obtener dedicateds por categoría
export const obtenerDedicatedsPorCategoria = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { categoria } = req.params;
        const dedicateds = await Dedicated.find({ categoria });
        if (dedicateds.length === 0) {
            return res.status(404).json({ message: 'No se encontraron dedicateds para esta categoría' });
        }
        return res.status(200).json(dedicateds);
    } catch (err) {
        next(err);
    }
};