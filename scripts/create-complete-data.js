/**
 * Script completo para crear datos de ejemplo visibles en la app
 * Incluye: Profesionales, Autónomos, Dedicados, Productos
 * Ejecutar con: node scripts/create-complete-data.js
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
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Esquemas
const schemas = {
  Professional: new mongoose.Schema({
    name: String,
    profession: String,
    experience: Number,
    score: Number,
    categorie: String,
    description: String,
    image: String,
    rating: Number,
    reviews: Number
  }, { collection: 'professionals' }),

  Autonomous: new mongoose.Schema({
    nombre: String,
    descripcion: String,
    categoria: String,
    ubicacion: String,
    rating: Number,
    reviews: Number,
    imageUrl: String,
    servicios: [String]
  }, { collection: 'autonomous' }),

  Dedicated: new mongoose.Schema({
    name: String,
    profession: String,
    experience: Number,
    score: Number,
    categorie: String,
    description: String,
    image: String,
    rating: Number
  }, { collection: 'dedicateds' }),

  Category: new mongoose.Schema({
    nombre: String,
    descripcion: String,
    activa: Boolean,
    imagen: String
  }, { collection: 'categories' }),

  Product: new mongoose.Schema({
    product_info: {
      name: String,
      description: String,
      imageUrl: [String]
    },
    product_status: {
      status: String,
      price: Number,
      stock: Number
    },
    tags: [String],
    categorie: mongoose.Schema.Types.ObjectId,
    user: mongoose.Schema.Types.ObjectId,
    associate: [String],
    rating: Number
  }, { collection: 'products' }),

  User: new mongoose.Schema({
    primary_data: {
      name: String,
      email: String,
      password: String
    },
    personal_data: {
      phone: String,
      location: String
    },
    account_settings: {
      role: String,
      active: Boolean,
      flags: {
        isProvider: Boolean,
        isProfessional: Boolean
      }
    }
  }, { collection: 'users' })
};

const models = {};
for (const [name, schema] of Object.entries(schemas)) {
  models[name] = mongoose.model(name, schema);
}

// Datos de profesionales destacados
const professionalData = [
  {
    name: 'Dr. María González',
    profession: 'Médica General',
    experience: 15,
    score: 4.8,
    categorie: 'Salud',
    description: 'Médica con 15 años de experiencia en medicina general',
    image: 'https://via.placeholder.com/200x200?text=Dr.María',
    rating: 4.8,
    reviews: 24
  },
  {
    name: 'Ing. Carlos Rodríguez',
    profession: 'Ingeniero de Sistemas',
    experience: 12,
    score: 4.7,
    categorie: 'Tecnología',
    description: 'Especialista en desarrollo de software y consultoría IT',
    image: 'https://via.placeholder.com/200x200?text=Ing.Carlos',
    rating: 4.7,
    reviews: 18
  },
  {
    name: 'Arq. Ana Martínez',
    profession: 'Arquitecta',
    experience: 10,
    score: 4.9,
    categorie: 'Construcción',
    description: 'Arquitecta especializada en diseño residencial e interiorismo',
    image: 'https://via.placeholder.com/200x200?text=Arq.Ana',
    rating: 4.9,
    reviews: 31
  },
  {
    name: 'Chef Roberto Silva',
    profession: 'Chef Profesional',
    experience: 20,
    score: 4.6,
    categorie: 'Gastronomía',
    description: 'Chef internacional con experiencia en cocina fusión',
    image: 'https://via.placeholder.com/200x200?text=Chef.Roberto',
    rating: 4.6,
    reviews: 42
  },
  {
    name: 'Prof. Laura Díaz',
    profession: 'Profesora de Inglés',
    experience: 8,
    score: 4.85,
    categorie: 'Educación',
    description: 'Profesora certificada con metodología de enseñanza moderna',
    image: 'https://via.placeholder.com/200x200?text=Prof.Laura',
    rating: 4.85,
    reviews: 15
  }
];

// Datos de autónomos destacados
const autonomousData = [
  {
    nombre: 'Servicios de Plomería Express',
    descripcion: 'Servicio de plomería rápido y confiable',
    categoria: 'Servicios',
    ubicacion: 'Buenos Aires',
    rating: 4.7,
    reviews: 28,
    imageUrl: 'https://via.placeholder.com/200x200?text=Plomería',
    servicios: ['Reparación tuberías', 'Instalación grifería', 'Emergencias 24h']
  },
  {
    nombre: 'Diseño Gráfico Creativo',
    descripcion: 'Soluciones de diseño innovadoras para tu negocio',
    categoria: 'Diseño',
    ubicacion: 'CABA',
    rating: 4.8,
    reviews: 35,
    imageUrl: 'https://via.placeholder.com/200x200?text=Diseño',
    servicios: ['Logos', 'Branding', 'Material promocional']
  },
  {
    nombre: 'Consultoría Legal Personal',
    descripcion: 'Asesoría legal profesional y confiable',
    categoria: 'Legal',
    ubicacion: 'Buenos Aires',
    rating: 4.9,
    reviews: 22,
    imageUrl: 'https://via.placeholder.com/200x200?text=Legal',
    servicios: ['Contratos', 'Herencias', 'Derecho laboral']
  },
  {
    nombre: 'Fotografía de Eventos',
    descripcion: 'Captura los momentos especiales de tu vida',
    categoria: 'Fotografía',
    ubicacion: 'Gran Buenos Aires',
    rating: 4.6,
    reviews: 45,
    imageUrl: 'https://via.placeholder.com/200x200?text=Fotografía',
    servicios: ['Bodas', 'XV años', 'Eventos corporativos']
  },
  {
    nombre: 'Clases de Música a Domicilio',
    descripcion: 'Aprende música con profesores especializados',
    categoria: 'Educación',
    ubicacion: 'Buenos Aires',
    rating: 4.8,
    reviews: 19,
    imageUrl: 'https://via.placeholder.com/200x200?text=Música',
    servicios: ['Guitarra', 'Piano', 'Canto']
  }
];

// Datos de dedicados destacados
const dedicatedData = [
  {
    name: 'Elena Vargas',
    profession: 'Nutricionista',
    experience: 8,
    score: 4.7,
    categorie: 'Salud',
    description: 'Especialista en nutrición y dietas personalizadas',
    image: 'https://via.placeholder.com/200x200?text=Elena',
    rating: 4.7
  },
  {
    name: 'Miguel Herrera',
    profession: 'Personal Trainer',
    experience: 6,
    score: 4.6,
    categorie: 'Fitness',
    description: 'Entrenador personal certificado',
    image: 'https://via.placeholder.com/200x200?text=Miguel',
    rating: 4.6
  },
  {
    name: 'Sofia Morales',
    profession: 'Diseñadora de Interiores',
    experience: 9,
    score: 4.8,
    categorie: 'Diseño',
    description: 'Experta en espacios y ambientes funcionales',
    image: 'https://via.placeholder.com/200x200?text=Sofia',
    rating: 4.8
  }
];

// Datos de productos
const productData = [
  {
    product_info: {
      name: 'Laptop Dell XPS 13',
      description: 'Laptop ultraportátil de última generación con Intel Core i7',
      imageUrl: ['https://via.placeholder.com/300x300?text=Laptop+XPS']
    },
    product_status: {
      status: 'active',
      price: 75000,
      stock: 5
    },
    tags: ['tecnología', 'computadoras', 'laptops'],
    rating: 4.8
  },
  {
    product_info: {
      name: 'Monitor LG Ultrawide 34"',
      description: 'Monitor ultraancho 34" con resolución 3440x1440',
      imageUrl: ['https://via.placeholder.com/300x300?text=Monitor+LG']
    },
    product_status: {
      status: 'active',
      price: 45000,
      stock: 8
    },
    tags: ['tecnología', 'monitores', 'computadoras'],
    rating: 4.7
  },
  {
    product_info: {
      name: 'Teclado Mecánico RGB',
      description: 'Teclado mecánico gamer con switches Cherry MX',
      imageUrl: ['https://via.placeholder.com/300x300?text=Teclado+Mecánico']
    },
    product_status: {
      status: 'active',
      price: 12000,
      stock: 15
    },
    tags: ['periféricos', 'gamer', 'teclados'],
    rating: 4.6
  },
  {
    product_info: {
      name: 'Mouse Logitech MX Master 3',
      description: 'Mouse profesional inalámbrico con precisión extrema',
      imageUrl: ['https://via.placeholder.com/300x300?text=Mouse+Logitech']
    },
    product_status: {
      status: 'active',
      price: 8500,
      stock: 20
    },
    tags: ['periféricos', 'mouse', 'oficina'],
    rating: 4.9
  },
  {
    product_info: {
      name: 'Headphones Sony WH-1000XM5',
      description: 'Auriculares con cancelación de ruido activa',
      imageUrl: ['https://via.placeholder.com/300x300?text=Headphones+Sony']
    },
    product_status: {
      status: 'active',
      price: 35000,
      stock: 10
    },
    tags: ['audio', 'auriculares', 'tecnología'],
    rating: 4.85
  },
  {
    product_info: {
      name: 'Silla Gamer Secretlab Omega',
      description: 'Silla de gaming premium con soporte lumbar ajustable',
      imageUrl: ['https://via.placeholder.com/300x300?text=Silla+Gamer']
    },
    product_status: {
      status: 'active',
      price: 28000,
      stock: 3
    },
    tags: ['muebles', 'gamer', 'oficina'],
    rating: 4.7
  },
  {
    product_info: {
      name: 'Escritorio Gaming RGB',
      description: 'Escritorio grande con iluminación RGB integrada',
      imageUrl: ['https://via.placeholder.com/300x300?text=Escritorio+Gaming']
    },
    product_status: {
      status: 'active',
      price: 18000,
      stock: 6
    },
    tags: ['muebles', 'escritorios', 'gamer'],
    rating: 4.5
  },
  {
    product_info: {
      name: 'Webcam Logitech 4K',
      description: 'Cámara web 4K para streaming y videoconferencias',
      imageUrl: ['https://via.placeholder.com/300x300?text=Webcam+4K']
    },
    product_status: {
      status: 'active',
      price: 15000,
      stock: 12
    },
    tags: ['periféricos', 'cámaras', 'streaming'],
    rating: 4.6
  }
];

// Crear datos
const createData = async () => {
  try {
    console.log('\n🌱 Iniciando creación de datos completos...\n');

    // 1. Crear profesionales
    console.log('👨‍⚕️  Creando profesionales destacados...');
    let professionalCount = 0;
    for (const prof of professionalData) {
      const exists = await models.Professional.findOne({ name: prof.name });
      if (!exists) {
        await models.Professional.create(prof);
        console.log(`   ✅ ${prof.name}`);
        professionalCount++;
      }
    }
    console.log(`   📊 Total creados: ${professionalCount}\n`);

    // 2. Crear autónomos
    console.log('🚀 Creando autónomos destacados...');
    let autonomousCount = 0;
    for (const auto of autonomousData) {
      const exists = await models.Autonomous.findOne({ nombre: auto.nombre });
      if (!exists) {
        await models.Autonomous.create(auto);
        console.log(`   ✅ ${auto.nombre}`);
        autonomousCount++;
      }
    }
    console.log(`   📊 Total creados: ${autonomousCount}\n`);

    // 3. Crear dedicados
    console.log('💼 Creando dedicados destacados...');
    let dedicatedCount = 0;
    for (const ded of dedicatedData) {
      const exists = await models.Dedicated.findOne({ name: ded.name });
      if (!exists) {
        await models.Dedicated.create(ded);
        console.log(`   ✅ ${ded.name}`);
        dedicatedCount++;
      }
    }
    console.log(`   📊 Total creados: ${dedicatedCount}\n`);

    // 4. Crear categorías
    console.log('📁 Creando categorías...');
    const categories = [
      { nombre: 'Electrónica', descripcion: 'Productos tecnológicos', activa: true, imagen: 'electronica.jpg' },
      { nombre: 'Ropa', descripcion: 'Prendas y accesorios', activa: true, imagen: 'ropa.jpg' },
      { nombre: 'Hogar', descripcion: 'Artículos para el hogar', activa: true, imagen: 'hogar.jpg' }
    ];
    
    let categoryCount = 0;
    const categoryMap = {};
    for (const cat of categories) {
      const exists = await models.Category.findOne({ nombre: cat.nombre });
      if (exists) {
        categoryMap[cat.nombre] = exists._id;
      } else {
        const created = await models.Category.create(cat);
        categoryMap[cat.nombre] = created._id;
        console.log(`   ✅ ${cat.nombre}`);
        categoryCount++;
      }
    }
    console.log(`   📊 Total creados: ${categoryCount}\n`);

    // 5. Crear usuario provider para productos
    console.log('👤 Creando usuario provider...');
    let userId;
    // Password hash simple - en producción usar bcryptjs real
    const hashedPassword = 'Test1234!!';
    
    const existingUser = await models.User.findOne({ 'primary_data.email': 'vendor@example.com' });
    if (existingUser) {
      userId = existingUser._id;
      console.log('   ⏭️  Usuario ya existe\n');
    } else {
      const newUser = await models.User.create({
        primary_data: {
          name: 'Vendor Test',
          email: 'vendor@example.com',
          password: hashedPassword
        },
        personal_data: {
          phone: '1234567890',
          location: 'Buenos Aires'
        },
        account_settings: {
          role: 'provider',
          active: true,
          flags: {
            isProvider: true,
            isProfessional: false
          }
        }
      });
      userId = newUser._id;
      console.log('   ✅ Usuario creado\n');
    }

    // 6. Crear productos
    console.log('📦 Creando productos...');
    let productCount = 0;
    const electronicaId = categoryMap['Electrónica'];
    
    for (const prod of productData) {
      const exists = await models.Product.findOne({ 'product_info.name': prod.product_info.name });
      if (!exists) {
        const productToCreate = {
          ...prod,
          categorie: electronicaId,
          user: userId,
          associate: []
        };
        await models.Product.create(productToCreate);
        console.log(`   ✅ ${prod.product_info.name}`);
        productCount++;
      }
    }
    console.log(`   📊 Total creados: ${productCount}\n`);

    // Resumen
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ DATOS CREADOS EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════');
    console.log(`
📊 Resumen:
   👨‍⚕️  Profesionales:    ${professionalCount}
   🚀 Autónomos:       ${autonomousCount}
   💼 Dedicados:       ${dedicatedCount}
   📁 Categorías:      ${categoryCount}
   📦 Productos:       ${productCount}

🎯 Próximos pasos:
   1. Iniciar servidor: npm start
   2. Acceder a: http://localhost:3000
   3. Ver profesionales: GET /api/professional
   4. Ver autónomos: GET /api/autonomous
   5. Ver productos: GET /api/productType
    `);

  } catch (error) {
    console.error('❌ Error creando datos:', error.message);
    throw error;
  }
};

// Ejecutar
const main = async () => {
  try {
    await connectDB();
    await createData();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
};

main();
