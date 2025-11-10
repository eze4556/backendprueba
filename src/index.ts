import 'reflect-metadata';
// Importa la aplicación principal de Express
import app from './app';
const chalk = require('chalk');

// Inicia el servidor en el puerto configurado y muestra un mensaje en consola
app.listen(app.get('port'), () => {
  console.log(`Server on port ${chalk.greenBright(app.get('port'))} ✔`);
});