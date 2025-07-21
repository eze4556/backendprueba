import mongoose from 'mongoose';
const chalk = require('chalk');
import { environment } from '../environments/environments';

const { MONGO_DB_URI } = environment();

mongoose
  .connect(MONGO_DB_URI.toString())
  .then(() => {
    console.log(`Working on ${chalk.greenBright('local')} ✔`);
    console.log(`${chalk.bgRed('Launched... ')} 🚀`);
  })
  .catch((err) => {
    console.log(err);
  });
