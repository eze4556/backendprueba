import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Professional from '../app/professional/models/professional.models';
import Autonomous from '../app/autonomous/models/autonomous.models';
import Dedicated from '../app/dedicated/models/dedicated.models';

export const debugInfo = async (req: Request, res: Response) => {
  try {
    const dbName = mongoose.connection.db?.databaseName;
    const connectionState = mongoose.connection.readyState;
    
    const counts = await Promise.all([
      Professional.countDocuments(),
      Autonomous.countDocuments(),
      Dedicated.countDocuments()
    ]);

    const professionals = await Professional.find().limit(2);
    const autonomous = await Autonomous.find().limit(2);
    const dedicated = await Dedicated.find().limit(2);

    const debugData = {
      database: {
        name: dbName,
        connectionState: connectionState === 1 ? 'Connected' : 'Disconnected',
        uri: process.env.MONGO_DB_LOCAL_URI ? 'LOCAL_URI_SET' : 'LOCAL_URI_NOT_SET'
      },
      counts: {
        professionals: counts[0],
        autonomous: counts[1],
        dedicated: counts[2]
      },
      sampleData: {
        professionals: professionals.map(p => ({ 
          name: p.name, 
          profession: p.profession, 
          score: p.score 
        })),
        autonomous: autonomous.map(a => ({ 
          name: a.name, 
          score: a.score 
        })),
        dedicated: dedicated.map(d => ({ 
          name: d.name, 
          profession: d.profession, 
          score: d.score 
        }))
      }
    };

    return res.status(200).json(debugData);
  } catch (error) {
    return res.status(500).json({ 
      error: 'Debug error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};