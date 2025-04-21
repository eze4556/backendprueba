import { Router, Request, Response, NextFunction } from 'express';
import Autonomous from '../../autonomous/models/autonomous.models';
import Dedicated from '../../dedicated/models/dedicated.models';
import Professional from '../../professional/models/professional.models';
import { rankItems } from '../ranking.utils';
import type { Item } from '../ranking.types';

const router = Router();

router.post('/', (req, res) => {
    const { name, score, categorie } = req.body;
    // Lógica para manejar los datos recibidos
    res.status(201).json({ message: 'Ranking creado', data: { name, score, categorie } });
});

const getRankings = async (): Promise<Item[]> => {
    const autonomous = await Autonomous.find();
    const dedicated = await Dedicated.find();
    const professional = await Professional.find();

    const items: Item[] = [
        ...autonomous.map(a => ({ name: a.name, score: a.score, categorie: a.categorie })),
        ...dedicated.map((d: { name: string; score: number; categorie: string }) => ({ name: d.name, score: d.score, categorie: d.categorie })),
        ...professional.map((p: { name: string; score: number; categorie: string }) => ({ name: p.name, score: p.score, categorie: p.categorie }))
    ];

    return rankItems(items);
};

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rankedItems = await getRankings();
        res.json(rankedItems);
    } catch (err) {
        next(err);
    }
});

export default router;