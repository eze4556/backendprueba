import mongoose from 'mongoose';
import { environment } from '../environments/environments';
import UserModel from '../app/users/models/user.models';

beforeAll(async () => {
  const env = environment();
  await mongoose.connect(env.MONGO_DB_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

// Asegurarse de que los modelos necesarios estén registrados
beforeEach(() => {
  if (!mongoose.models.users) {
    mongoose.model('users', UserModel.schema);
  }
});