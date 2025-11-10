# Multi-stage build para optimizar el tamaño de la imagen
FROM node:18-alpine AS builder

# Instalar herramientas del sistema necesarias
RUN apk add --no-cache python3 make g++

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript
RUN npm run build

# Stage final - imagen de producción
FROM node:18-alpine AS production

# Instalar dumb-init para manejo de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S lvendor -u 1001 -G nodejs

# Establecer directorio de trabajo
WORKDIR /app

# Copiar dependencias de producción desde el stage builder
COPY --from=builder --chown=lvendor:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=lvendor:nodejs /app/build ./build
COPY --from=builder --chown=lvendor:nodejs /app/package*.json ./

# Crear directorio para uploads
RUN mkdir -p /app/uploads && chown -R lvendor:nodejs /app/uploads

# Cambiar al usuario no-root
USER lvendor

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio con dumb-init para manejo de señales
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "build/src/server.js"]

# Etiquetas para metadata
LABEL maintainer="lvendor"
LABEL version="1.0.0"
LABEL description="Like Vendor Backend API"