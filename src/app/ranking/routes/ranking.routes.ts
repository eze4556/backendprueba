import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { rankItems } from '../ranking.utils';
import type { Item } from '../ranking.types';
import {
  getProfessionalsRanking,
  getAutonomousRanking,
  getDedicatedRanking,
  getProfessionalById,
  getAutonomousById,
  getDedicatedById
} from '../controllers/ranking.controller';

const router = Router();

// Rutas p�blicas para obtener vendedores por ID
router.get('/professional/:id', getProfessionalById);
router.get('/autonomous/:id', getAutonomousById);
router.get('/dedicated/:id', getDedicatedById);

// Rutas p�blicas para ranking
router.get('/professionals', getProfessionalsRanking);
router.get('/autonomous', getAutonomousRanking);
router.get('/dedicated', getDedicatedRanking);

router.post('/', (req, res) => {
    const { name, score, categorie } = req.body;
    res.status(201).json({ message: 'Ranking creado', data: { name, score, categorie } });
});

const getRankings = async (): Promise<Item[]> => {
    const db = mongoose.connection.db;

    const autonomous = await db.collection('autonomous').find({ verified: true }).toArray();
    const dedicated = await db.collection('dedicated').find({ verified: true }).toArray();
    const professional = await db.collection('professionals').find({ verified: true }).toArray();

    const items: Item[] = [
        ...autonomous.map((a: any) => ({
            id: a._id.toString(),
            name: a.name,
            score: a.score || 0,
            categorie: a.category || 'General',
            type: 'autonomous'
        })),
        ...dedicated.map((d: any) => ({
            id: d._id.toString(),
            name: d.name,
            score: d.score || 0,
            categorie: d.category || 'General',
            type: 'dedicated'
        })),
        ...professional.map((p: any) => ({
            id: p._id.toString(),
            name: p.name,
            score: p.score || 0,
            categorie: p.category || 'General',
            type: 'professional'
        }))
    ];

    return rankItems(items);
};

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rankedItems = await getRankings();
        res.json({ ranking: rankedItems });
    } catch (err) {
        next(err);
    }
});

export default router;
