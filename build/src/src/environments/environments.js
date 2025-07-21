"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.environment = void 0;
const ts_dotenv_1 = require("ts-dotenv");
const env = (0, ts_dotenv_1.load)({
    ENVIRONMENT: String,
    MONGO_DB_LOCAL_URI: String,
    MONGO_DB_PRODUCTION_URI: String,
    BUCKET_NAME: String,
    AWS_ID: String,
    AWS_SECRET_KEY: String,
    AWS_URL: String,
});
const environment = () => {
    return env.ENVIRONMENT === 'development'
        ? {
            MONGO_DB_URI: env.MONGO_DB_LOCAL_URI,
            AWS_BUCKET: env.BUCKET_NAME,
            AWS_SECRET_KEY: env.AWS_SECRET_KEY,
            AWS_ID: env.AWS_ID,
            AWS_URL: env.AWS_URL,
        }
        : {
            MONGO_DB_URI: env.MONGO_DB_PRODUCTION_URI,
            AWS_BUCKET: env.BUCKET_NAME,
            AWS_SECRET_KEY: env.AWS_SECRET_KEY,
            AWS_ID: env.AWS_ID,
            AWS_URL: env.AWS_URL,
        };
};
exports.environment = environment;
