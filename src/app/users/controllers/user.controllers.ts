import { Request, Response } from 'express';
import UserModel from '../models/user.models';
import HttpHandler from '../../../helpers/handler.helper';
import bcrypt from 'bcryptjs';
import { CREATED, INTERNAL_ERROR, BAD_REQUEST, UNAUTHORIZED } from '../../../constants/codes.constanst';
import Token from '../../../auth/token/token';
import * as jwt from 'jsonwebtoken';
import { load } from 'ts-dotenv';
import { UserRole } from '../../../interfaces/roles.interface';

const env = load({
  JWT_KEY: String,
});

// Importa los módulos y utilidades necesarios
// Carga de variables de entorno
// Extiende la interfaz Request para incluir email y password
interface AuthRequest extends Request {
  email?: string;
  password?: string;
}

// Controlador principal de usuarios
class UserControllers {
  // Registra un nuevo usuario en la base de datos
  async registerUser(req: AuthRequest, res: Response) {
    try {
      console.log('registerUser - starting registration process');
      
      // Desestructura los datos del cuerpo de la petición
      const { primary_data, billing_data, auth_data } = req.body;
      const { email, password } = req; // Extract email and password from request
      
      console.log('registerUser - email from request:', email);
      console.log('registerUser - password from request:', password ? 'EXISTS' : 'MISSING');
      console.log('registerUser - primary_data:', primary_data);
      console.log('registerUser - auth_data:', auth_data);
      
      // Valida que email y password existan
      if (!email || !password) {
        console.log('registerUser - missing email or password');
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'Bad request error',
          error: 'Email and password are required'
        });
      }
      
      console.log('registerUser - setting email in primary_data');
      primary_data.email = email; // Set email in object primary_data
      
      console.log('registerUser - hashing password');
      auth_data.password = await bcrypt.hash(password as string, 10); // Hash and set the password in auth_data
      
      console.log('registerUser - creating user model');
      const user = new UserModel({
        primary_data,
        billing_data,
        auth_data,
      });
      
      console.log('registerUser - saving user to database');
      const data = await user.save(); // Save new user
      
      console.log('registerUser - user saved successfully, id:', data._id);
      
      // Mapear el tipo de usuario a un rol del sistema
      const getUserRole = (userType: string): UserRole => {
        switch (userType?.toLowerCase()) {
          case 'admin':
          case 'administrador':
            return UserRole.ADMIN;
          case 'professional':
          case 'profesional':
            return UserRole.PROFESSIONAL;
          case 'autonomous':
          case 'autonomo':
          case 'autónomo':
            return UserRole.AUTONOMOUS;
          case 'dedicated':
          case 'dedicado':
            return UserRole.DEDICATED;
          case 'provider':
          case 'proveedor':
            return UserRole.PROVIDER;
          case 'moderator':
          case 'moderador':
            return UserRole.MODERATOR;
          default:
            return UserRole.USER;
        }
      };

      const userRole = getUserRole(data.primary_data.type);
      
      // Genera un token JWT para el usuario registrado con información de roles
      const token = jwt.sign(
        { 
          email: data.primary_data.email, 
          _id: data._id,
          name: data.primary_data.name,
          role: userRole,
          isActive: true
        }, 
        env.JWT_KEY, 
        { expiresIn: '60d' }
      );
      
      // Devuelve la respuesta con el usuario creado y el token
      return res.status(CREATED).json({
        success: true,
        message: 'User created successfully',
        token: token,
        user: {
          _id: data._id,
          email: data.primary_data.email,
          name: data.primary_data.name,
          last_name: data.primary_data.last_name
        }
      });
    } catch (e) {
      console.error('registerUser - error:', e);
      // Maneja errores internos
      return res.status(INTERNAL_ERROR).json({
        success: false,
        message: 'Internal Error',
        error: (e as Error).message
      });
    }
  }

  // Edita los datos de un usuario existente
  async editUser(req: Request, res: Response) {
    const { email, name } = req.body;
    const user = await UserModel.findOneAndUpdate({ email }, { name }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated', user });
  }

  // Obtiene la información de un usuario
  async deleteUser(req: Request, res: Response) {
    const { email } = req.body;
    const user = await UserModel.findOneAndDelete({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  }

  // Obtiene la información de un usuario
  async getUser(req: Request, res: Response) {
    try {
      const userToken = (req as any).roleUser || req.user as { email: string };

      if (!userToken || !userToken.email) {
        return res.status(400).json({
          success: false,
          message: 'Email not provided in token'
        });
      }

      const user = await UserModel.findOne({ 'primary_data.email': userToken.email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Usuario obtenido exitosamente',
        user
      });
    } catch (e) {
      console.error('Error getting user:', e);
      return res.status(INTERNAL_ERROR).json({
        success: false,
        message: 'Internal Error',
        error: (e as Error).message
      });
    }
  }

  // Guarda información personal del usuario
  async savePersonalInfo(req: Request, res: Response) {
    try {
      const { name, lastName, dni, areaCode, phone, location, birthDate, receiveNews } = req.body;
      const userToken = (req as any).roleUser || req.user as { email: string };

      if (!userToken || !userToken.email) {
        return res.status(400).json({
          success: false,
          message: 'Email not provided in token'
        });
      }
      
      // Buscar el usuario por email del token
      const user = await UserModel.findOne({ 'primary_data.email': userToken.email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Actualizar la información personal
      user.primary_data.name = name;
      user.primary_data.last_name = lastName;
      user.personal_info = {
        dni,
        areaCode,
        phone,
        location,
        birthDate,
        receiveNews
      };

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Información personal guardada exitosamente',
        user
      });
    } catch (e) {
      console.error('Error saving personal info:', e);
      return res.status(INTERNAL_ERROR).json({
        success: false,
        message: 'Internal Error',
        error: (e as Error).message
      });
    }
  }

  // Actualiza el rol de un usuario
  async updateUserRole(req: Request, res: Response) {
    try {
      const { role } = req.body;
      const userToken = (req as any).roleUser || req.user as { email: string };

      if (!userToken || !userToken.email) {
        return res.status(400).json({
          success: false,
          message: 'Email not provided in token'
        });
      }

      const user = await UserModel.findOne({ 'primary_data.email': userToken.email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Actualizar el rol
      user.primary_data.type = role;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Rol actualizado exitosamente',
        user
      });
    } catch (e) {
      console.error('Error updating user role:', e);
      return res.status(INTERNAL_ERROR).json({
        success: false,
        message: 'Internal Error',
        error: (e as Error).message
      });
    }
  }

  // Guarda información de perfil del usuario
  async saveProfileInfo(req: Request, res: Response) {
    try {
      const { username, accountName, description } = req.body;
      const userToken = (req as any).roleUser || req.user as { email: string };

      if (!userToken || !userToken.email) {
        return res.status(400).json({
          success: false,
          message: 'Email not provided in token'
        });
      }

      const user = await UserModel.findOne({ 'primary_data.email': userToken.email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Actualizar información del perfil
      user.primary_data.nickname = username;
      user.primary_data.description = description;
      
      // Guardar imagen de perfil si se proporciona
      if (req.file) {
        user.profile_image = req.file.path;
      }

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Perfil de emprendedor guardado exitosamente',
        user
      });
    } catch (e) {
      console.error('Error saving profile info:', e);
      return res.status(INTERNAL_ERROR).json({
        success: false,
        message: 'Internal Error',
        error: (e as Error).message
      });
    }
  }

  // Actualiza información de la cuenta del usuario
  async updateAccountInfo(req: Request, res: Response) {
    try {
      const { phone } = req.body;
      const userToken = (req as any).roleUser || req.user as { email: string };

      if (!userToken || !userToken.email) {
        return res.status(400).json({
          success: false,
          message: 'Email not provided in token'
        });
      }

      const user = await UserModel.findOne({ 'primary_data.email': userToken.email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Actualizar teléfono
      user.primary_data.phone = phone;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Información de cuenta actualizada exitosamente',
        user
      });
    } catch (e) {
      console.error('Error updating account info:', e);
      return res.status(INTERNAL_ERROR).json({
        success: false,
        message: 'Internal Error',
        error: (e as Error).message
      });
    }
  }

  // Obtiene el perfil del usuario autenticado
  async getCurrentUserProfile(req: Request, res: Response) {
    try {
      const userToken = (req as any).roleUser || req.user as { email: string };

      if (!userToken || !userToken.email) {
        return res.status(400).json({
          success: false,
          message: 'Email not provided in token'
        });
      }

      const user = await UserModel.findOne({ 'primary_data.email': userToken.email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        user
      });
    } catch (e) {
      console.error('Error getting user profile:', e);
      return res.status(INTERNAL_ERROR).json({
        success: false,
        message: 'Internal Error',
        error: (e as Error).message
      });
    }
  }

  // Inicia sesión de usuario
  async loginUser(req: Request, res: Response) {
    try {
      console.log('loginUser - req.body:', JSON.stringify(req.body, null, 2));

      console.log('loginUser - iniciando proceso de login');

      const { email, contraseña } = req.body;
      console.log('loginUser - email recibido:', email);
      console.log('loginUser - contraseña recibida:', contraseña ? 'EXISTS' : 'MISSING');
      console.log('Valor recibido de contraseña:', JSON.stringify(contraseña));
      
      // Validar que se proporcionen email y contraseña
      if (!email || !contraseña) {
        console.log('loginUser - faltan email o contraseña');
        return res.status(BAD_REQUEST).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }
      
        // Buscar usuario en la base de datos
        console.log('loginUser - buscando usuario en BD con email:', email.toLowerCase());
        const user = await UserModel.findOne({ 'primary_data.email': email.toLowerCase() });

          console.log('loginUser - resultado de búsqueda:', user ? 'ENCONTRADO' : 'NO ENCONTRADO');
          if (user) {
            console.log('loginUser - user._id:', user._id);
            console.log('loginUser - user.primary_data.email:', user.primary_data.email);
            console.log('Usuario encontrado:', JSON.stringify(user, null, 2));
          }
          if (!user) {
        console.log('loginUser - usuario no encontrado');
        return res.status(UNAUTHORIZED).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }
      
      console.log('loginUser - usuario encontrado, verificando contraseña...');

      // Verificar contraseña usando bcrypt
      console.log('loginUser - verificando contraseña...');
      const isValidPassword = await bcrypt.compare(contraseña, user.auth_data.password);
      console.log('loginUser - isValidPassword:', isValidPassword);      if (!isValidPassword) {
        console.log('loginUser - contraseña incorrecta');
        return res.status(UNAUTHORIZED).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }
      
      console.log('loginUser - contraseña válida, verificando estado activo...');
      
      // Verificar que el usuario esté activo
      if (!user.permissions.active) {
        console.log('loginUser - usuario inactivo');
        return res.status(UNAUTHORIZED).json({
          success: false,
          message: 'Usuario inactivo. Contacta al administrador.'
        });
      }
      
      console.log('loginUser - autenticación exitosa, generando token...');
      
      // Mapear el tipo de usuario a un rol del sistema
      const getUserRole = (userType: string): UserRole => {
        switch (userType?.toLowerCase()) {
          case 'super_admin':
          case 'superadmin':
            return UserRole.ADMIN; // Super admin tiene permisos de admin
          case 'admin':
          case 'administrador':
            return UserRole.ADMIN;
          case 'professional':
          case 'profesional':
            return UserRole.PROFESSIONAL;
          case 'autonomous':
          case 'autonomo':
          case 'autónomo':
            return UserRole.AUTONOMOUS;
          case 'dedicated':
          case 'dedicado':
            return UserRole.DEDICATED;
          case 'provider':
          case 'proveedor':
            return UserRole.PROVIDER;
          case 'moderator':
          case 'moderador':
            return UserRole.MODERATOR;
          default:
            return UserRole.USER;
        }
      };

      const userRole = getUserRole(user.primary_data.type);
      
      // Generar flags basados en el rol del usuario
      const flags = {
        isProvider: userRole === UserRole.PROVIDER,
        isProfessional: userRole === UserRole.PROFESSIONAL
      };
      
      // Generar token JWT con información de roles
      const token = jwt.sign(
        { 
          id: String(user._id),
          email: user.primary_data.email, 
          _id: user._id,
          name: user.primary_data.name,
          role: userRole,
          isActive: user.permissions.active,
          flags: flags
        }, 
        env.JWT_KEY, 
        { expiresIn: '60d' }
      );
      
      console.log('loginUser - token generado exitosamente');
      
      // Preparar datos del usuario para la respuesta (sin contraseña)
      const userData = {
        _id: user._id,
        email: user.primary_data.email,
        name: user.primary_data.name,
        last_name: user.primary_data.last_name,
        nickname: user.primary_data.nickname,
        type: user.primary_data.type,
        role: userRole, // Incluir el rol mapeado
        description: user.primary_data.description,
        permissions: user.permissions,
        profile_image: user.profile_image
      };
      
      console.log('loginUser - login exitoso para usuario:', user.primary_data.email);
      
      return res.status(200).json({
        success: true,
        message: 'Login exitoso',
        token,
        user: userData
      });
      
    } catch (error) {
      console.error('loginUser - error:', error);
      return res.status(INTERNAL_ERROR).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

export default new UserControllers();
