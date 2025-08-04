import express, { Request, Response, NextFunction } from 'express';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';

const app = express();

AWS.config.update({ region: 'us-east-1' });
const medialive = new AWS.MediaLive();

// Middleware opcional para parsear JSON
app.use(express.json());

// Define a type for the user object that includes the role property
interface User {
  id: string;
  role: string;
}

// Middleware de autorización para restringir la creación del stream a ciertos roles
function checkRole(req: Request, res: Response, next: NextFunction) {
  // Suponiendo que ya tienes un sistema de autenticación y que el rol se encuentra en req.user.role
  // Ejemplo de roles permitidos:
  const allowedRoles = ['proveedores', 'professional', 'autonomous', 'dedicated'];
  if (req.user && (req.user as User).role && allowedRoles.includes((req.user as User).role)) {
    next();
  } else {
    res.status(403).json({ error: 'Acceso denegado' });
  }
}

// Endpoint para iniciar una transmisión (ejemplo previo)
app.post('/start-stream', async (req: Request, res: Response) => {
  const params = { ChannelId: 'CHANNEL_ID' };

  try {
    const data = await medialive.startChannel(params).promise();
    res.json({ url: (data as any).Channel.Outputs[0].Url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Nuevo endpoint para crear un stream con enlace único, solo para roles autorizados
app.post('/create-stream', async (req: Request, res: Response) => {
  try {
    // Genera un identificador único para el stream.
    const streamId = uuid();
    
    // Aquí debes integrar la API de la plataforma de streaming que elijas (por ejemplo, AWS IVS o MediaLive)
    // Para este ejemplo, se construye un enlace de streaming personalizado.
    const streamingUrl = `https://3860af3e8e3fbfdb.mediapackage.us-east-2.amazonaws.com/out/v1/2bc53f81fcf64e61bb6ea055cb0b3349/index.m3u8`;

    // Opcional: guardar en la base de datos la relación entre el usuario y este streamId
    // await saveStreamToDatabase(req.user.id, streamId, streamingUrl);

    res.json({ streamingUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// Exporta las rutas para ser utilizadas en el archivo principal de la aplicación
export default app;