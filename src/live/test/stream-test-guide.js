/**
 * Script de Prueba para el Sistema de Streaming
 * 
 * Instrucciones:
 * 1. Asegúrate de que el servidor esté corriendo
 * 2. Asegúrate de tener un token JWT válido
 * 3. Ejecuta: node build/src/live/test/stream.test.js
 */

// Este es un ejemplo de cómo probar el sistema usando cURL o Postman

console.log(`
╔════════════════════════════════════════════════════════════════╗
║          Sistema de Streaming en Vivo - Pruebas                ║
╚════════════════════════════════════════════════════════════════╝

🔧 CONFIGURACIÓN INICIAL
========================

1. Servidor debe estar corriendo en: http://localhost:3000
2. MongoDB debe estar activo
3. Necesitas un token JWT válido


📝 OBTENER TOKEN JWT
====================

curl -X POST http://localhost:3000/api/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "tu_email@ejemplo.com",
    "password": "tu_password"
  }'

Guarda el token de la respuesta.


🎥 CREAR UN STREAM
==================

curl -X POST http://localhost:3000/api/stream \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer TU_TOKEN_JWT" \\
  -d '{
    "title": "Mi primera transmisión",
    "description": "Esto es una prueba de streaming",
    "quality": "720p",
    "category": "tecnologia",
    "tags": ["demo", "test"]
  }'

Guarda el streamId de la respuesta.


▶️ INICIAR EL STREAM
====================

curl -X POST http://localhost:3000/api/stream/STREAM_ID/start \\
  -H "Authorization: Bearer TU_TOKEN_JWT"


📋 LISTAR STREAMS ACTIVOS
==========================

curl http://localhost:3000/api/stream


🔍 OBTENER INFORMACIÓN DE UN STREAM
====================================

curl http://localhost:3000/api/stream/STREAM_ID


👥 UNIRSE A UN STREAM
======================

curl -X POST http://localhost:3000/api/stream/STREAM_ID/join \\
  -H "Authorization: Bearer TU_TOKEN_JWT"


⏹️ FINALIZAR EL STREAM
=======================

curl -X POST http://localhost:3000/api/stream/STREAM_ID/end \\
  -H "Authorization: Bearer TU_TOKEN_JWT"


📊 VER MIS STREAMS
===================

curl http://localhost:3000/api/stream/my/streams \\
  -H "Authorization: Bearer TU_TOKEN_JWT"


🔌 CONECTAR CON SOCKET.IO (JavaScript)
=======================================

const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  path: '/socket.io/'
});

socket.on('connect', () => {
  console.log('Conectado a Socket.IO');
  
  // Unirse a un stream
  socket.emit('join-stream', {
    streamId: 'STREAM_ID',
    userId: 'USER_ID',
    username: 'Usuario123',
    role: 'professional'
  });
});

socket.on('viewer-joined', (data) => {
  console.log('Viewer se unió:', data);
});

socket.on('chat-message', (data) => {
  console.log('Mensaje:', data);
});

// Enviar mensaje
socket.emit('send-message', {
  streamId: 'STREAM_ID',
  message: 'Hola a todos!'
});


🧪 PRUEBA CON POSTMAN
======================

1. Importa esta colección:

{
  "info": {
    "name": "Streaming API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Login",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "url": "http://localhost:3000/api/login",
        "body": {
          "mode": "raw",
          "raw": "{\\"email\\": \\"usuario@ejemplo.com\\", \\"password\\": \\"password\\"}"
        }
      }
    },
    {
      "name": "2. Crear Stream",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "Authorization", "value": "Bearer {{token}}"}
        ],
        "url": "http://localhost:3000/api/stream",
        "body": {
          "mode": "raw",
          "raw": "{\\"title\\": \\"Mi Stream\\", \\"quality\\": \\"720p\\"}"
        }
      }
    },
    {
      "name": "3. Listar Streams",
      "request": {
        "method": "GET",
        "header": [],
        "url": "http://localhost:3000/api/stream"
      }
    }
  ]
}

2. Define una variable de entorno "token" con tu JWT


✅ VERIFICAR QUE TODO FUNCIONA
===============================

1. Servidor responde:
   curl http://localhost:3000/health

2. Socket.IO está activo:
   Abre en el navegador: http://localhost:3000/socket.io/
   Deberías ver: {"code":0,"message":"Transport unknown"}

3. MongoDB conectado:
   Verifica los logs del servidor


🎯 FLUJO COMPLETO DE PRUEBA
=============================

1. Login y obtener token
2. Crear stream
3. Iniciar stream  
4. Conectar Socket.IO desde otro cliente
5. Unirse al stream como viewer
6. Enviar mensajes en el chat
7. Finalizar stream
8. Verificar estadísticas


📚 MÁS INFORMACIÓN
===================

- Documentación completa: docs/STREAMING_GUIDE.md
- Setup Angular: docs/ANGULAR_SETUP.md
- Resumen: docs/STREAMING_README.md


🐛 ERRORES COMUNES
===================

Error 401: Token inválido o expirado
Error 403: Usuario sin permisos para transmitir
Error 404: Stream no encontrado
Error 429: Límite de streams alcanzado


💡 TIPS
========

- Usa roles permitidos: proveedores, professional, autonomous, dedicated, admin
- Los streams tienen estados: waiting, live, ended
- Calidades disponibles: 480p, 720p, 1080p, 4K
- El chat se guarda en MongoDB
- Las estadísticas se calculan automáticamente


¡Buena suerte con las pruebas! 🚀
`);
