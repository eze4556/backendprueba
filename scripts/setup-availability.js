/**
 * Script para configurar availability para todos los profesionales existentes
 * Ejecutar con: node scripts/setup-availability.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CNN || 'mongodb://localhost:27017/like-vendor', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Definir esquemas mínimos
const ProfessionalSchema = new mongoose.Schema({
  name: String,
  profession: String,
  experience: Number,
  score: Number,
  categorie: String
});

const AvailabilitySchema = new mongoose.Schema({
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true,
    unique: true
  },
  timezone: {
    type: String,
    default: 'America/Argentina/Buenos_Aires'
  },
  schedule: [{
    dayOfWeek: Number,
    isWorking: Boolean,
    slots: [{
      start: String,
      end: String,
      isAvailable: Boolean
    }]
  }],
  blockedDates: [Date]
}, { timestamps: true });

const Professional = mongoose.model('Professional', ProfessionalSchema, 'professionals');
const Availability = mongoose.model('Availability', AvailabilitySchema, 'availabilities');

// Generar horario de trabajo estándar (Lunes a Viernes 9-18, Sábado 9-13)
const generateStandardSchedule = () => {
  const schedule = [];
  
  for (let day = 0; day < 7; day++) {
    const daySchedule = {
      dayOfWeek: day,
      isWorking: day >= 1 && day <= 6, // Lunes a Sábado
      slots: []
    };
    
    if (day >= 1 && day <= 5) {
      // Lunes a Viernes: 9:00-13:00, 14:00-18:00
      daySchedule.slots = [
        { start: '09:00', end: '10:00', isAvailable: true },
        { start: '10:00', end: '11:00', isAvailable: true },
        { start: '11:00', end: '12:00', isAvailable: true },
        { start: '12:00', end: '13:00', isAvailable: true },
        { start: '14:00', end: '15:00', isAvailable: true },
        { start: '15:00', end: '16:00', isAvailable: true },
        { start: '16:00', end: '17:00', isAvailable: true },
        { start: '17:00', end: '18:00', isAvailable: true }
      ];
    } else if (day === 6) {
      // Sábado: 9:00-13:00
      daySchedule.slots = [
        { start: '09:00', end: '10:00', isAvailable: true },
        { start: '10:00', end: '11:00', isAvailable: true },
        { start: '11:00', end: '12:00', isAvailable: true },
        { start: '12:00', end: '13:00', isAvailable: true }
      ];
    }
    
    schedule.push(daySchedule);
  }
  
  return schedule;
};

// Crear availability para profesionales
const setupAvailability = async () => {
  try {
    console.log('\n🔍 Buscando profesionales sin availability...');
    
    const professionals = await Professional.find({});
    console.log(`📊 Total de profesionales encontrados: ${professionals.length}`);
    
    let created = 0;
    let skipped = 0;
    
    for (const professional of professionals) {
      // Verificar si ya tiene availability
      const existing = await Availability.findOne({ professionalId: professional._id });
      
      if (existing) {
        console.log(`⏭️  ${professional.name} - Ya tiene availability configurada`);
        skipped++;
        continue;
      }
      
      // Crear availability con horario estándar
      const availability = new Availability({
        professionalId: professional._id,
        timezone: 'America/Argentina/Buenos_Aires',
        schedule: generateStandardSchedule(),
        blockedDates: []
      });
      
      await availability.save();
      console.log(`✅ ${professional.name} - Availability creada`);
      created++;
    }
    
    console.log('\n📈 Resumen:');
    console.log(`   ✅ Creados: ${created}`);
    console.log(`   ⏭️  Omitidos (ya existían): ${skipped}`);
    console.log(`   📊 Total: ${professionals.length}`);
    
  } catch (error) {
    console.error('❌ Error configurando availability:', error);
    throw error;
  }
};

// Ejecutar script
const main = async () => {
  try {
    await connectDB();
    await setupAvailability();
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en el script:', error);
    process.exit(1);
  }
};

main();
