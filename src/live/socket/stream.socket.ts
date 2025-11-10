import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import Stream from '../models/stream.model';
import ChatMessage, { MessageType } from '../models/chatMessage.model';
import { createLogger } from '../../utils/logger';

const logger = createLogger('StreamSocket');

// Interface para los datos del usuario en el socket
interface UserSocketData {
  userId: string;
  username: string;
  role?: string;
}

// Interface para eventos del socket
interface ServerToClientEvents {
  'viewer-joined': (data: { userId: string; username: string; viewerCount: number }) => void;
  'viewer-left': (data: { userId: string; viewerCount: number }) => void;
  'stream-started': (data: { streamId: string; startedAt: Date }) => void;
  'stream-ended': (data: { streamId: string; endedAt: Date; duration: number }) => void;
  'chat-message': (data: any) => void;
  'stream-stats-updated': (data: { viewerCount: number; peakViewers: number }) => void;
  'webrtc-offer': (data: { offer: any; from: string }) => void;
  'webrtc-answer': (data: { answer: any; from: string }) => void;
  'webrtc-ice-candidate': (data: { candidate: any; from: string }) => void;
  'error': (data: { message: string }) => void;
}

interface ClientToServerEvents {
  'join-stream': (data: { streamId: string; userId: string; username: string; role?: string }) => void;
  'leave-stream': (data: { streamId: string; userId: string }) => void;
  'send-message': (data: { streamId: string; message: string; messageType?: MessageType }) => void;
  'webrtc-offer': (data: { streamId: string; offer: any; targetUserId?: string }) => void;
  'webrtc-answer': (data: { streamId: string; answer: any; targetUserId: string }) => void;
  'webrtc-ice-candidate': (data: { streamId: string; candidate: any; targetUserId?: string }) => void;
  'start-broadcast': (data: { streamId: string }) => void;
  'stop-broadcast': (data: { streamId: string }) => void;
  'request-offer': (data: { streamId: string; streamerUserId: string; requestingUserId: string }) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData extends UserSocketData {
  streamId?: string;
}

export class StreamSocketManager {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env["FRONTEND_URL"] || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    logger.info('Socket.IO configurado para streaming');
  }

  private setupEventHandlers(): void {
    // ...existing code...
    this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
      logger.info(`Cliente conectado: ${socket.id}`);

      // Evento: Solicitud de nueva oferta desde un viewer
      socket.on('request-offer', async (data: { streamId: string; streamerUserId: string; requestingUserId: string }) => {
        try {
          const { streamId, streamerUserId, requestingUserId } = data;
          // Buscar el socket del streamer
          const streamerSocket = await this.findSocketByUserId(streamId, streamerUserId);
          if (streamerSocket) {
            streamerSocket.emit('request-offer', {
              streamId,
              streamerUserId,
              requestingUserId // <--- siempre el viewer real
            });
            logger.info(`Solicitud de nueva oferta reenviada al streamer (${streamerUserId}) para viewer (${requestingUserId}) en stream ${streamId}`);
          } else {
            logger.warn(`No se encontró el socket del streamer (${streamerUserId}) para reenviar la solicitud de oferta en stream ${streamId}`);
          }
        } catch (error: any) {
          logger.error('Error al reenviar solicitud de oferta:', error);
        }
      });

      // Evento: Unirse a un stream
      socket.on('join-stream', async (data) => {
        try {
          const { streamId, userId, username, role } = data;

          // Validar que el stream existe
          const stream = await Stream.findOne({ streamId });
          if (!stream) {
            socket.emit('error', { message: 'Stream no encontrado' });
            return;
          }

          // Unirse a la sala del stream
          socket.join(streamId);
          socket.data.streamId = streamId;
          socket.data.userId = userId;
          socket.data.username = username;
          socket.data.role = role;

          // Agregar el viewer al stream
          await stream.addViewer({
            userId,
            username,
            joinedAt: new Date(),
            socketId: socket.id,
            isActive: true
          });

          // Notificar a todos en el stream
          this.io.to(streamId).emit('viewer-joined', {
            userId,
            username,
            viewerCount: stream.viewerCount
          });

          // Enviar mensaje de sistema al chat
          const systemMessage = new ChatMessage({
            streamId,
            userId: 'system',
            username: 'Sistema',
            message: `${username} se ha unido al stream`,
            messageType: MessageType.SYSTEM
          });
          await systemMessage.save();

          this.io.to(streamId).emit('chat-message', {
            userId: systemMessage.userId,
            username: systemMessage.username,
            message: systemMessage.message,
            messageType: systemMessage.messageType,
            timestamp: systemMessage.timestamp
          });

          logger.info(`Usuario ${username} (${userId}) se unió al stream ${streamId}`);
        } catch (error: any) {
          logger.error('Error al unirse al stream:', error);
          socket.emit('error', { message: 'Error al unirse al stream' });
        }
      });

      // Evento: Salir de un stream
      socket.on('leave-stream', async (data) => {
        try {
          const { streamId, userId } = data;

          const stream = await Stream.findOne({ streamId });
          if (!stream) return;

          // Remover el viewer del stream
          await stream.removeViewer(userId);

          // Salir de la sala
          socket.leave(streamId);

          // Notificar a todos
          this.io.to(streamId).emit('viewer-left', {
            userId,
            viewerCount: stream.viewerCount
          });

          logger.info(`Usuario ${userId} salió del stream ${streamId}`);
        } catch (error: any) {
          logger.error('Error al salir del stream:', error);
        }
      });

      // Evento: Enviar mensaje al chat
      socket.on('send-message', async (data) => {
        try {
          const { streamId, message, messageType } = data;

          if (!socket.data.userId || !socket.data.username) {
            socket.emit('error', { message: 'Usuario no identificado' });
            return;
          }

          // Validar que el stream existe y el chat está habilitado
          const stream = await Stream.findOne({ streamId });
          if (!stream) {
            socket.emit('error', { message: 'Stream no encontrado' });
            return;
          }

          if (!stream.metadata.chatEnabled) {
            socket.emit('error', { message: 'El chat está deshabilitado' });
            return;
          }

          // Guardar el mensaje
          const chatMessage = new ChatMessage({
            streamId,
            userId: socket.data.userId,
            username: socket.data.username,
            userRole: socket.data.role,
            message: message.trim(),
            messageType: messageType || MessageType.TEXT
          });
          await chatMessage.save();

          // Emitir el mensaje a todos en el stream
          this.io.to(streamId).emit('chat-message', {
            userId: chatMessage.userId,
            username: chatMessage.username,
            userRole: chatMessage.userRole,
            message: chatMessage.message,
            messageType: chatMessage.messageType,
            timestamp: chatMessage.timestamp
          });

          logger.info(`Mensaje en stream ${streamId} de ${socket.data.username}: ${message}`);
        } catch (error: any) {
          logger.error('Error al enviar mensaje:', error);
          socket.emit('error', { message: 'Error al enviar mensaje' });
        }
      });

      // Evento: WebRTC Offer (del streamer a los viewers)
      socket.on('webrtc-offer', async (data) => {
        try {
          const { streamId, offer, targetUserId } = data;

          if (targetUserId) {
            // Enviar offer a un viewer específico
            const targetSocket = await this.findSocketByUserId(streamId, targetUserId);
            if (targetSocket) {
              targetSocket.emit('webrtc-offer', {
                offer,
                from: socket.data.userId || 'unknown'
              });
            }
          } else {
            // Broadcast offer a todos los viewers en el stream
            socket.to(streamId).emit('webrtc-offer', {
              offer,
              from: socket.data.userId || 'unknown'
            });
          }

          logger.info(`WebRTC offer enviado en stream ${streamId}`);
        } catch (error: any) {
          logger.error('Error al enviar WebRTC offer:', error);
        }
      });

      // Evento: WebRTC Answer (de los viewers al streamer)
      socket.on('webrtc-answer', async (data) => {
        try {
          const { streamId, answer, targetUserId } = data;

          const targetSocket = await this.findSocketByUserId(streamId, targetUserId);
          if (targetSocket) {
            targetSocket.emit('webrtc-answer', {
              answer,
              from: socket.data.userId || 'unknown'
            });
          }

          logger.info(`WebRTC answer enviado en stream ${streamId}`);
        } catch (error: any) {
          logger.error('Error al enviar WebRTC answer:', error);
        }
      });

      // Evento: WebRTC ICE Candidate
      socket.on('webrtc-ice-candidate', async (data) => {
        try {
          const { streamId, candidate, targetUserId } = data;

          if (targetUserId) {
            const targetSocket = await this.findSocketByUserId(streamId, targetUserId);
            if (targetSocket) {
              targetSocket.emit('webrtc-ice-candidate', {
                candidate,
                from: socket.data.userId || 'unknown'
              });
            }
          } else {
            socket.to(streamId).emit('webrtc-ice-candidate', {
              candidate,
              from: socket.data.userId || 'unknown'
            });
          }
        } catch (error: any) {
          logger.error('Error al enviar ICE candidate:', error);
        }
      });

      // Evento: Iniciar broadcast (solo para el streamer)
      socket.on('start-broadcast', async (data) => {
        try {
          const { streamId } = data;

          const stream = await Stream.findOne({ streamId });
          if (!stream) {
            socket.emit('error', { message: 'Stream no encontrado' });
            return;
          }

          // Verificar que el usuario es el streamer
          if (stream.streamer.userId.toString() !== socket.data.userId) {
            socket.emit('error', { message: 'No tienes permisos para iniciar el broadcast' });
            return;
          }

          await stream.startStream();

          // Notificar a todos que el stream comenzó
          this.io.to(streamId).emit('stream-started', {
            streamId,
            startedAt: stream.startedAt!
          });

          logger.info(`Stream ${streamId} iniciado por ${socket.data.username}`);
        } catch (error: any) {
          logger.error('Error al iniciar broadcast:', error);
          socket.emit('error', { message: 'Error al iniciar broadcast' });
        }
      });

      // Evento: Detener broadcast (solo para el streamer)
      socket.on('stop-broadcast', async (data) => {
        try {
          const { streamId } = data;

          const stream = await Stream.findOne({ streamId });
          if (!stream) {
            socket.emit('error', { message: 'Stream no encontrado' });
            return;
          }

          // Verificar que el usuario es el streamer
          if (stream.streamer.userId.toString() !== socket.data.userId) {
            socket.emit('error', { message: 'No tienes permisos para detener el broadcast' });
            return;
          }

          await stream.endStream();

          // Notificar a todos que el stream terminó
          this.io.to(streamId).emit('stream-ended', {
            streamId,
            endedAt: stream.endedAt!,
            duration: stream.duration || 0
          });

          logger.info(`Stream ${streamId} finalizado por ${socket.data.username}`);
        } catch (error: any) {
          logger.error('Error al detener broadcast:', error);
          socket.emit('error', { message: 'Error al detener broadcast' });
        }
      });

      // Evento: Desconexión
      socket.on('disconnect', async () => {
        try {
          if (socket.data.streamId && socket.data.userId) {
            const stream = await Stream.findOne({ streamId: socket.data.streamId });
            if (stream) {
              await stream.removeViewer(socket.data.userId);

              this.io.to(socket.data.streamId).emit('viewer-left', {
                userId: socket.data.userId,
                viewerCount: stream.viewerCount
              });
            }
          }

          logger.info(`Cliente desconectado: ${socket.id}`);
        } catch (error: any) {
          logger.error('Error al desconectar:', error);
        }
      });
    });
  }

  /**
   * Buscar un socket por userId en una sala específica
   */
  private async findSocketByUserId(streamId: string, userId: string): Promise<any> {
    const sockets = await this.io.in(streamId).fetchSockets();
    const targetSocket = sockets.find(s => s.data.userId === userId);
    return targetSocket || null;
  }

  /**
   * Obtener la instancia de Socket.IO
   */
  public getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
    return this.io;
  }
}
