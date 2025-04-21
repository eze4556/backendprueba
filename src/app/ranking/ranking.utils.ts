import { Router, Request, Response, NextFunction } from 'express';
import Autonomous from '../autonomous/models/autonomous.models';
import Dedicated from '../dedicated/models/dedicated.models';
import Professional from '../professional/models/professional.models';
import { Item } from './ranking.types';

export const rankItems = (items: Item[]): Item[] => {
    // Lógica para ordenar los items
    return items.sort((a, b) => b.score - a.score);
};

const router = Router();

const obtenerRankings = async (req: Request, res: Response): Promise<Item[]> => {
    const autonomous = await Autonomous.find();
    const dedicated = await Dedicated.find();
    const professional = await Professional.find();

    const items: Item[] = [
        ...autonomous.map((a: { name: string; score: number; categorie: string }) => ({ name: a.name, score: a.score, categorie: a.categorie })),
        ...dedicated.map((d: { name: string; score: number; categorie: string }) => ({ name: d.name, score: d.score, categorie: d.categorie })),
        ...professional.map((p: { name: string; score: number; categorie: string }) => ({ name: p.name, score: p.score, categorie: p.categorie }))
    ];

    return rankItems(items); 
};


router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rankedItems = await obtenerRankings(req, res);
        res.json(rankedItems);
    } catch (err) {
        next(err);
    }
});

export default router;