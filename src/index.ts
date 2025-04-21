import app from './app';
import chalk from 'chalk';

app.listen(app.get('port'), () => {
  console.log(`Server on port ${chalk.greenBright(app.get('port'))} ✔`);
});
// Archivo de barril para exportar todos los middlewares

export * from './middleware/auth.middleware';
export * from './middleware/error.middleware';
export * from './middleware/logger.middleware';
export * from './middleware/validator.middleware';