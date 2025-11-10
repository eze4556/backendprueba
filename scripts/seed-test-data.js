/**
 * Script para crear un conjunto completo de datos de prueba
 * Ejecutar con: node scripts/seed-test-data.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Esquemas simplificados
const UserSchema = new mongoose.Schema({
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
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  activa: Boolean,
  imagen: String
});

const ProductSchema = new mongoose.Schema({
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
  user: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const User = mongoose.model('User', UserSchema, 'users');
const Category = mongoose.model('Category', CategorySchema, 'categories');
const Product = mongoose.model('Product', ProductSchema, 'products');

// Datos de prueba
const seedData = async () => {
  try {
    console.log('\n🌱 Iniciando seed de datos de prueba...\n');

    // 1. Crear usuarios de prueba
    console.log('👥 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('Test1234!!', 10);
    
    const testUsers = [
      {
        primary_data: {
          name: 'Usuario Test',
          email: 'test@example.com',
          password: hashedPassword
        },
        personal_data: {
          phone: '1234567890',
          location: 'Buenos Aires'
        },
        account_settings: {
          role: 'user',
          active: true,
          flags: {
            isProvider: false,
            isProfessional: false
          }
        }
      },
      {
        primary_data: {
          name: 'Provider Test',
          email: 'provider@example.com',
          password: hashedPassword
        },
        personal_data: {
          phone: '1234567891',
          location: 'Córdoba'
        },
        account_settings: {
          role: 'provider',
          active: true,
          flags: {
            isProvider: true,
            isProfessional: false
          }
        }
      },
      {
        primary_data: {
          name: 'Professional Test',
          email: 'professional@example.com',
          password: hashedPassword
        },
        personal_data: {
          phone: '1234567892',
          location: 'Rosario'
        },
        account_settings: {
          role: 'professional',
          active: true,
          flags: {
            isProvider: false,
            isProfessional: true
          }
        }
      }
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      const existing = await User.findOne({ 'primary_data.email': userData.primary_data.email });
      if (!existing) {
        const user = await User.create(userData);
        createdUsers.push(user);
        console.log(`  ✅ Usuario creado: ${user.primary_data.email}`);
      } else {
        createdUsers.push(existing);
        console.log(`  ⏭️  Usuario ya existe: ${userData.primary_data.email}`);
      }
    }

    // 2. Crear categorías de prueba
    console.log('\n📁 Creando categorías...');
    const testCategories = [
      {
        nombre: 'Electrónica',
        descripcion: 'Productos electrónicos y tecnología',
        activa: true,
        imagen: 'electronica.jpg'
      },
      {
        nombre: 'Ropa',
        descripcion: 'Vestimenta y accesorios',
        activa: true,
        imagen: 'ropa.jpg'
      },
      {
        nombre: 'Hogar',
        descripcion: 'Artículos para el hogar',
        activa: true,
        imagen: 'hogar.jpg'
      },
      {
        nombre: 'Deportes',
        descripcion: 'Equipamiento deportivo',
        activa: true,
        imagen: 'deportes.jpg'
      }
    ];

    const createdCategories = [];
    for (const catData of testCategories) {
      const existing = await Category.findOne({ nombre: catData.nombre });
      if (!existing) {
        const category = await Category.create(catData);
        createdCategories.push(category);
        console.log(`  ✅ Categoría creada: ${category.nombre}`);
      } else {
        createdCategories.push(existing);
        console.log(`  ⏭️  Categoría ya existe: ${catData.nombre}`);
      }
    }

    // 3. Crear productos de prueba
    console.log('\n📦 Creando productos...');
    const providerUser = createdUsers.find(u => u.account_settings.flags.isProvider);
    
    if (providerUser && createdCategories.length > 0) {
      const testProducts = [
        {
          product_info: {
            name: 'Laptop Test',
            description: 'Laptop de prueba para testing',
            imageUrl: ['laptop.jpg']
          },
          product_status: {
            status: 'active',
            price: 50000,
            stock: 10
          },
          tags: ['tecnología', 'computación'],
          categorie: createdCategories[0]._id,
          user: providerUser._id
        },
        {
          product_info: {
            name: 'Mouse Inalámbrico',
            description: 'Mouse inalámbrico de prueba',
            imageUrl: ['mouse.jpg']
          },
          product_status: {
            status: 'active',
            price: 5000,
            stock: 50
          },
          tags: ['tecnología', 'periféricos'],
          categorie: createdCategories[0]._id,
          user: providerUser._id
        },
        {
          product_info: {
            name: 'Remera Deportiva',
            description: 'Remera deportiva de prueba',
            imageUrl: ['remera.jpg']
          },
          product_status: {
            status: 'active',
            price: 8000,
            stock: 30
          },
          tags: ['ropa', 'deporte'],
          categorie: createdCategories[1]._id,
          user: providerUser._id
        }
      ];

      for (const prodData of testProducts) {
        const existing = await Product.findOne({ 'product_info.name': prodData.product_info.name });
        if (!existing) {
          const product = await Product.create(prodData);
          console.log(`  ✅ Producto creado: ${product.product_info.name}`);
        } else {
          console.log(`  ⏭️  Producto ya existe: ${prodData.product_info.name}`);
        }
      }
    }

    console.log('\n📈 Resumen de datos creados:');
    console.log(`   👥 Usuarios: ${testUsers.length}`);
    console.log(`   📁 Categorías: ${testCategories.length}`);
    console.log(`   📦 Productos: ${providerUser ? 3 : 0}`);
    console.log('\n✅ Seed completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }
};

// Ejecutar script
const main = async () => {
  try {
    await connectDB();
    await seedData();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error en el script:', error);
    process.exit(1);
  }
};

main();
