import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const testEndpoint = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Test endpoint llamado');
    
    // Verificar conexión a la base de datos
    const dbState = mongoose.connection.readyState;
    const dbName = mongoose.connection.db?.databaseName;
    
    console.log(`📊 Estado de la DB: ${dbState}, Nombre: ${dbName}`);
    
    const testData = {
      message: 'Servidor funcionando correctamente',
      timestamp: new Date(),
      database: {
        connected: dbState === 1,
        name: dbName
      }
    };
    
    console.log('✅ Enviando respuesta de prueba');
    return res.status(200).json(testData);
  } catch (error) {
    console.error('❌ Error en test endpoint:', error);
    return res.status(500).json({ error: 'Error en test endpoint' });
  }
};