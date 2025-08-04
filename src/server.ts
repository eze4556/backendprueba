// Importa la aplicación principal de Express
import app from './app';

const PORT = process.env.PORT || 3000;

// Inicia el servidor en el puerto especificado y muestra un mensaje en consola
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
