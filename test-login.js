const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const axios = require('axios');

// Definir esquema
const User = mongoose.model('users', new mongoose.Schema({
  primary_data: new mongoose.Schema({
    name: String,
    last_name: String,
    email: String,
    nickname: String,
    type: String,
    description: String
  }),
  auth_data: new mongoose.Schema({
    password: String
  }),
  permissions: new mongoose.Schema({
    active: { type: Boolean, default: true },
    role: { type: String, default: 'user' }
  }),
  isProvider: { type: Boolean, default: false },
  isProfessional: { type: Boolean, default: false }
}));

async function testLogin() {
  await mongoose.connect('mongodb://localhost:27017/test');

  // Verificar usuario en BD
  const user = await User.findOne({ 'primary_data.email': 'user@test.com' });
  console.log('User found:', user ? user.primary_data.email : 'not found');

  if (user) {
    const isValid = await bcrypt.compare('password123', user.auth_data.password);
    console.log('Password valid:', isValid);
  }

  // Probar API login
  try {
    const response = await axios.post('http://localhost:3000/api/login', {
      email: 'user@test.com',
      contraseña: 'password123'
    });
    console.log('Login success:', response.data);
  } catch (error) {
    console.log('Login error:', error.response ? error.response.data : error.message);
  }

  // await mongoose.disconnect();
}

testLogin();