// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('like-vendor');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('products'); 
db.createCollection('orders');
db.createCollection('payments');
db.createCollection('categories');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "createdAt": -1 });

db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "price": 1 });
db.products.createIndex({ "createdAt": -1 });

db.orders.createIndex({ "userId": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": -1 });

db.payments.createIndex({ "orderId": 1 });
db.payments.createIndex({ "status": 1 });
db.payments.createIndex({ "createdAt": -1 });

db.categories.createIndex({ "name": 1 }, { unique: true });

print('Database initialized successfully with indexes');

// Create default admin user (change password in production)
db.users.insertOne({
  email: "admin@likevendor.com",
  name: "Administrator", 
  password: "$2b$10$rQRj8GKaSDKpxr9UzQFAMOhFqqKGRCgMxV8QKKOQlLlrGxX2lVKPW", // password: admin123
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Default admin user created');

// Create sample categories
db.categories.insertMany([
  { name: "Electrónicos", description: "Dispositivos electrónicos", isActive: true, createdAt: new Date() },
  { name: "Ropa", description: "Ropa y accesorios", isActive: true, createdAt: new Date() },
  { name: "Hogar", description: "Artículos para el hogar", isActive: true, createdAt: new Date() },
  { name: "Deportes", description: "Artículos deportivos", isActive: true, createdAt: new Date() }
]);

print('Sample categories created');
print('MongoDB initialization completed!');