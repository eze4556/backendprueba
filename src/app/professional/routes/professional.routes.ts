import { Router } from 'express';
import { crearProfesional, obtenerProfesionales, actualizarProfesional, eliminarProfesional, getProfessionalById } from '../controllers/professional.controller';
import Token from '../../../auth/token/token';

const router = Router();

// Obtener todos los profesionales (debe estar ANTES de /:id)
router.get('/', obtenerProfesionales);

// Crear nuevo profesional - Ruta principal
router.post('/', Token.verifyToken, crearProfesional);

// Crear nuevo profesional - Ruta alternativa para compatibilidad
router.post('/crear', Token.verifyToken, crearProfesional);

// Obtener un profesional por ID
router.get('/:id', getProfessionalById);

// Actualizar un profesional
router.put('/:id', Token.verifyToken, actualizarProfesional);

// Eliminar un profesional
router.delete('/:id', Token.verifyToken, eliminarProfesional);

export default router;
