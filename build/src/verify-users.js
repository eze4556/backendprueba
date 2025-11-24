// verify-users.js
// Script para verificar usuarios en MongoDB en tiempo real (producción)

const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', userSchema);

const MONGO_URI = process.env.MONGO_DB_URI || process.env.MONGO_URI || 'mongodb://mongo:27017/likevendor';
const DB_NAME = process.env.DB_NAME || 'likevendor';

async function main() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    console.log('Conexión exitosa a la base de datos:', DB_NAME);

    const users = await User.find({});
    if (!users.length) {
      console.log('No se encontraron usuarios en la colección.');
    } else {
      console.log(`Usuarios encontrados (${users.length}):\n`);
      users.forEach(u => {
        console.log('-----------------------------');
        console.log('ID:', u._id);
        console.log('Email:', u.primary_data?.email);
        console.log('Password (hash):', u.auth_data?.password);
        console.log('Roles:', u.roles);
        console.log('Estado:', u.status);
      });
    }

    // Verifica si existe el admin
    const admin = await User.findOne({ 'primary_data.email': 'admin@likevendor.com' });
    if (admin) {
      console.log('\nUsuario admin encontrado:');
      console.log('ID:', admin._id);
      console.log('Email:', admin.primary_data?.email);
      console.log('Password (hash):', admin.auth_data?.password);
      console.log('Roles:', admin.roles);
      console.log('Estado:', admin.status);
    } else {
      console.log('\nUsuario admin NO encontrado.');
    }

    await mongoose.disconnect();
    console.log('Desconectado de MongoDB.');
  } catch (err) {
    console.error('Error al verificar usuarios:', err);
    process.exit(1);
  }
}

main();
