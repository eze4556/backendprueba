import express, { Request, Response } from 'express';
import * as AWS from 'aws-sdk';

const app = express();

AWS.config.update({ region: 'us-east-1' });
const medialive = new AWS.MediaLive();

// Middleware opcional para parsear JSON
app.use(express.json());

// Endpoint para iniciar una transmisión
app.post('/start-stream', async (req: Request, res: Response) => {
  // Definir parámetros. Reemplazar 'CHANNEL_ID' por el ID real del canal.
  const params = { ChannelId: 'CHANNEL_ID' };

  try {
    // Iniciar el canal mediante AWS MediaLive
    const data = await medialive.startChannel(params).promise();
    // Responder con la URL de salida (adaptar según la estructura del objeto data devuelto)
    res.json({ url: (data as any).Channel.Outputs[0].Url });
  } catch (err: any) {
    // Manejo básico de errores
    res.status(500).json({ error: err.message });
  }
});
