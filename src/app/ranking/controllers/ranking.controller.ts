import { Request, Response } from 'express';
import mongoose from 'mongoose';

/**
 * GET /api/ranking/professionals
 * Obtener profesionales ordenados por score para ranking
 */
export const getProfessionalsRanking = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    
    const professionals = await db.collection('professionals')
      .find({
        verified: true,
        score: { $exists: true }
      })
      .sort({ score: -1 })
      .limit(20)
      .toArray();

    res.json({
      success: true,
      count: professionals.length,
      data: professionals
    });
  } catch (error: any) {
    console.error('Error en getProfessionalsRanking:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener profesionales',
      error: error.message
    });
  }
};

/**
 * GET /api/ranking/autonomous
 * Obtener autónomos ordenados por score para ranking
 */
export const getAutonomousRanking = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    
    const autonomous = await db.collection('autonomous')
      .find({
        verified: true,
        score: { $exists: true }
      })
      .sort({ score: -1 })
      .limit(20)
      .toArray();

    res.json({
      success: true,
      count: autonomous.length,
      data: autonomous
    });
  } catch (error: any) {
    console.error('Error en getAutonomousRanking:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener autónomos',
      error: error.message
    });
  }
};

/**
 * GET /api/ranking/dedicated
 * Obtener dedicados ordenados por score para ranking
 */
export const getDedicatedRanking = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    
    const dedicated = await db.collection('dedicated')
      .find({
        verified: true,
        score: { $exists: true }
      })
      .sort({ score: -1 })
      .limit(20)
      .toArray();

    res.json({
      success: true,
      count: dedicated.length,
      data: dedicated
    });
  } catch (error: any) {
    console.error('Error en getDedicatedRanking:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dedicados',
      error: error.message
    });
  }
};

/**
 * GET /api/ranking/professional/:id
 * Obtener un profesional por ID
 */
export const getProfessionalById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');
    
    const professional = await db.collection('professionals')
      .findOne({ _id: new ObjectId(id) });

    if (!professional) {
      res.status(404).json({
        success: false,
        message: 'Profesional no encontrado'
      });
      return;
    }

    res.json(professional);
  } catch (error: any) {
    console.error('Error en getProfessionalById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener profesional',
      error: error.message
    });
  }
};

/**
 * GET /api/ranking/autonomous/:id
 * Obtener un autónomo por ID
 */
export const getAutonomousById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');
    
    const autonomous = await db.collection('autonomous')
      .findOne({ _id: new ObjectId(id) });

    if (!autonomous) {
      res.status(404).json({
        success: false,
        message: 'Autónomo no encontrado'
      });
      return;
    }

    res.json(autonomous);
  } catch (error: any) {
    console.error('Error en getAutonomousById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener autónomo',
      error: error.message
    });
  }
};

/**
 * GET /api/ranking/dedicated/:id
 * Obtener un dedicado por ID
 */
export const getDedicatedById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');
    
    const dedicated = await db.collection('dedicated')
      .findOne({ _id: new ObjectId(id) });

    if (!dedicated) {
      res.status(404).json({
        success: false,
        message: 'Dedicado no encontrado'
      });
      return;
    }

    res.json(dedicated);
  } catch (error: any) {
    console.error('Error en getDedicatedById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dedicado',
      error: error.message
    });
  }
};
