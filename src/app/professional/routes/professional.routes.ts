import { Router } from 'express';
import { crearProfesional, obtenerProfesionales, actualizarProfesional, eliminarProfesional, getProfessionalById } from '../controllers/professional.controller';
import Token from '../../../auth/token/token';

const router = Router();

// Ruta para manejar solicitudes POST
router.post('/', (req, res) => {
    const { name, profession } = req.body;
    // Lógica para manejar los datos recibidos
    res.status(201).json({ message: 'Profesional creado', data: { name, profession } });
  });

// Crear nuevo profesional
router.post('/crear', Token.verifyToken, crearProfesional);

// Obtener todos los profesionales
router.get('/', obtenerProfesionales);
router.get('/:id', getProfessionalById);

// Actualizar un profesional
router.put('/:id', Token.verifyToken, actualizarProfesional);

// Eliminar un profesional
router.delete('/:id', Token.verifyToken, eliminarProfesional);

export default router;
