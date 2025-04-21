import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = 3000; 
const uri = 'mongodb+srv://lvendor:UT5lU7EFk5DBqlfY@lvendor.np2wp.mongodb.net/test?authSource=admin&replicaSet=atlas-m49pqc-shard-0&ssl=true&retryWrites=true&w=majority';
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/uploads', express.static('uploads'));


app.use('/api', app);


mongoose.connect(uri)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB', err));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
