import mongoose from 'mongoose';
import UserModel from '../app/users/models/user.models';
import { StockMovement } from '../app/productTypes/models/stock-movement.model';

export const initializeModels = () => {
  // Registrar modelos
  if (!mongoose.models.users) {
    mongoose.model('users', UserModel.schema);
  }
  if (!mongoose.models['stock-movements']) {
    mongoose.model('stock-movements', StockMovement.schema);
  }
};

export default initializeModels;