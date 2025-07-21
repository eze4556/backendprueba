const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/likevendor', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function cleanExpiredCodes() {
  try {
    console.log('Limpiando códigos expirados...');
    
    // Definir el esquema del código directamente aquí
    const codeSchema = new mongoose.Schema({
      email: { type: String, required: true },
      code: { type: String, required: true },
      expiration: { type: Date, required: true },
      createdAt: { type: Number, default: Date.now }
    });
    
    const CodeModel = mongoose.model('Code', codeSchema);
    
    const result = await CodeModel.deleteMany({
      expiration: { $lt: new Date() }
    });
    
    console.log(`Se eliminaron ${result.deletedCount} códigos expirados`);
    
    // También eliminar códigos específicos por email si es necesario
    const specificResult = await CodeModel.deleteMany({
      email: 'aitormascapo@gmail.com'
    });
    
    console.log(`Se eliminaron ${specificResult.deletedCount} códigos para aitormascapo@gmail.com`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

cleanExpiredCodes(); 