"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AWS = __importStar(require("aws-sdk"));
const app = (0, express_1.default)();
AWS.config.update({ region: 'us-east-1' });
const medialive = new AWS.MediaLive();
// Middleware opcional para parsear JSON
app.use(express_1.default.json());
// Endpoint para iniciar una transmisión
app.post('/start-stream', async (req, res) => {
    // Definir parámetros. Reemplazar 'CHANNEL_ID' por el ID real del canal.
    const params = { ChannelId: 'CHANNEL_ID' };
    try {
        // Iniciar el canal mediante AWS MediaLive
        const data = await medialive.startChannel(params).promise();
        // Responder con la URL de salida (adaptar según la estructura del objeto data devuelto)
        res.json({ url: data.Channel.Outputs[0].Url });
    }
    catch (err) {
        // Manejo básico de errores
        res.status(500).json({ error: err.message });
    }
});
// Iniciar el servidor en el puerto 3000
app.listen(3000, () => console.log('Server running on port 3000'));
