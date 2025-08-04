// Importación de módulos principales de Express y utilidades
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import mongoose from 'mongoose';
import bodyParser from 'body-parser'; 
import path from 'path';

// Importación de rutas de los diferentes módulos de la aplicación
import usersRoutes from './app/users/routes/users.routes';
import codesRoutes from './app/codes/routes/code.routes';
import loginRoutes from './app/users/routes/login.routes';
import passwordRoutes from './app/users/routes/password.routes';
import categoriesRoutes from './app/categories/routes/categorie.routes';
import mediaRoutes from './app/media/routes/media.routes';
import vehicleRoutes from './app/vehicles/routes/vehicle.routes';
import professionalRoutes from './app/professional/routes/professional.routes';
import productTypeRoutes from './app/productTypes/routes/productType.routes';
import autonomousRoutes from './app/autonomous/routes/autonomous.routes';
import dedicatedRoutes from './app/dedicated/routes/dedicated.routes';
import rankingRoutes from './app/ranking/routes/ranking.routes';
import paymentRoutes from './app/payment/payment.controller';
import setCalculatorRoutes from './app/calculator/routes/calculatorRoutes';
import subscriptionRoutes from './app/subscripcion/routes/subscription.routes'; 
import providerRoutes from './app/proveedores/routes/provider.routes';
import streamRoutes from './live/stream';

// Importación y conexión a la base de datos
import './database/database';

// Inicialización de la aplicación Express
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Configuración para aceptar peticiones en formato JSON
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(morgan('dev'));
app.set('port', process.env.PORT || 3000);
// Middleware para habilitar CORS y permitir peticiones desde cualquier origen
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Responde a las peticiones preflight de CORS
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Registro de las rutas principales de la API
app.use('/api/code', codesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/categorie', categoriesRoutes);
app.use('/api/media', mediaRoutes);
app.use("/api/vehicle", vehicleRoutes);
app.use('/api/professional', professionalRoutes);
app.use('/api/productType', productTypeRoutes);
app.use('/api/autonomous', autonomousRoutes);
app.use('/api/dedicated', dedicatedRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/calculator', setCalculatorRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/providers', providerRoutes);
// Importación de las rutas de streaming
app.use('/api/stream', streamRoutes);

// Exportación de la aplicación para ser utilizada en el servidor principal
export default app;