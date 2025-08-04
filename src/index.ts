// Importa la aplicación principal de Express
import app from './app';
const chalk = require('chalk');


// Inicia el servidor en el puerto configurado y muestra un mensaje en consola
app.listen(app.get('port'), () => {
  console.log(`Server on port ${chalk.greenBright(app.get('port'))} ✔`);
});
// Archivo de barril para exportar todos los middlewares principales

export * from './middleware/auth.middleware';
export * from './middleware/error.middleware';
export * from './middleware/logger.middleware';
export * from './middleware/validator.middleware';