import express from 'express';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import mongoose from 'mongoose';
import bodyParser from 'body-parser'; 
import path from 'path';

// Routes
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

// Database
import './database/database';

// Settings
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(morgan('dev'));
app.set('port', process.env.PORT || 3000);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Routes usage
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

export default app;