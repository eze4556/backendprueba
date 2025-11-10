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
const user_models_1 = __importDefault(require("../models/user.models"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const jwt = __importStar(require("jsonwebtoken"));
const ts_dotenv_1 = require("ts-dotenv");
const roles_interface_1 = require("../../../interfaces/roles.interface");
const env = (0, ts_dotenv_1.load)({
    JWT_KEY: String,
});
// Controlador principal de usuarios
class UserControllers {
    // Registra un nuevo usuario en la base de datos
    async registerUser(req, res) {
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
                return res.status(codes_constanst_1.BAD_REQUEST).json({
                    success: false,
                    message: 'Bad request error',
                    error: 'Email and password are required'
                });
            }
            console.log('registerUser - setting email in primary_data');
            primary_data.email = email; // Set email in object primary_data
            console.log('registerUser - hashing password');
            auth_data.password = await bcrypt_1.default.hash(password, 10); // Hash and set the password in auth_data
            console.log('registerUser - creating user model');
            const user = new user_models_1.default({
                primary_data,
                billing_data,
                auth_data,
            });
            console.log('registerUser - saving user to database');
            const data = await user.save(); // Save new user
            console.log('registerUser - user saved successfully, id:', data._id);
            // Mapear el tipo de usuario a un rol del sistema
            const getUserRole = (userType) => {
                switch (userType === null || userType === void 0 ? void 0 : userType.toLowerCase()) {
                    case 'admin':
                    case 'administrador':
                        return roles_interface_1.UserRole.ADMIN;
                    case 'professional':
                    case 'profesional':
                        return roles_interface_1.UserRole.PROFESSIONAL;
                    case 'autonomous':
                    case 'autonomo':
                    case 'autónomo':
                        return roles_interface_1.UserRole.AUTONOMOUS;
                    case 'dedicated':
                    case 'dedicado':
                        return roles_interface_1.UserRole.DEDICATED;
                    case 'provider':
                    case 'proveedor':
                        return roles_interface_1.UserRole.PROVIDER;
                    case 'moderator':
                    case 'moderador':
                        return roles_interface_1.UserRole.MODERATOR;
                    default:
                        return roles_interface_1.UserRole.USER;
                }
            };
            const userRole = getUserRole(data.primary_data.type);
            // Genera un token JWT para el usuario registrado con información de roles
            const token = jwt.sign({
                email: data.primary_data.email,
                _id: data._id,
                name: data.primary_data.name,
                role: userRole,
                isActive: true
            }, env.JWT_KEY, { expiresIn: '60d' });
            // Devuelve la respuesta con el usuario creado y el token
            return res.status(codes_constanst_1.CREATED).json({
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
        }
        catch (e) {
            console.error('registerUser - error:', e);
            // Maneja errores internos
            return res.status(codes_constanst_1.INTERNAL_ERROR).json({
                success: false,
                message: 'Internal Error',
                error: e.message
            });
        }
    }
    // Edita los datos de un usuario existente
    async editUser(req, res) {
        const { email, name } = req.body;
        const user = await user_models_1.default.findOneAndUpdate({ email }, { name }, { new: true });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User updated', user });
    }
    // Obtiene la información de un usuario
    async deleteUser(req, res) {
        const { email } = req.body;
        const user = await user_models_1.default.findOneAndDelete({ email });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    }
    // Obtiene la información de un usuario
    async getUser(req, res) {
        try {
            const userToken = req.roleUser || req.user;
            if (!userToken || !userToken.email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email not provided in token'
                });
            }
            const user = await user_models_1.default.findOne({ 'primary_data.email': userToken.email });
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
        }
        catch (e) {
            console.error('Error getting user:', e);
            return res.status(codes_constanst_1.INTERNAL_ERROR).json({
                success: false,
                message: 'Internal Error',
                error: e.message
            });
        }
    }
    // Guarda información personal del usuario
    async savePersonalInfo(req, res) {
        try {
            const { name, lastName, dni, areaCode, phone, location, birthDate, receiveNews } = req.body;
            const userToken = req.roleUser || req.user;
            if (!userToken || !userToken.email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email not provided in token'
                });
            }
            // Buscar el usuario por email del token
            const user = await user_models_1.default.findOne({ 'primary_data.email': userToken.email });
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
        }
        catch (e) {
            console.error('Error saving personal info:', e);
            return res.status(codes_constanst_1.INTERNAL_ERROR).json({
                success: false,
                message: 'Internal Error',
                error: e.message
            });
        }
    }
    // Actualiza el rol de un usuario
    async updateUserRole(req, res) {
        try {
            const { role } = req.body;
            const userToken = req.roleUser || req.user;
            if (!userToken || !userToken.email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email not provided in token'
                });
            }
            const user = await user_models_1.default.findOne({ 'primary_data.email': userToken.email });
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
        }
        catch (e) {
            console.error('Error updating user role:', e);
            return res.status(codes_constanst_1.INTERNAL_ERROR).json({
                success: false,
                message: 'Internal Error',
                error: e.message
            });
        }
    }
    // Guarda información de perfil del usuario
    async saveProfileInfo(req, res) {
        try {
            const { username, accountName, description } = req.body;
            const userToken = req.roleUser || req.user;
            if (!userToken || !userToken.email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email not provided in token'
                });
            }
            const user = await user_models_1.default.findOne({ 'primary_data.email': userToken.email });
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
        }
        catch (e) {
            console.error('Error saving profile info:', e);
            return res.status(codes_constanst_1.INTERNAL_ERROR).json({
                success: false,
                message: 'Internal Error',
                error: e.message
            });
        }
    }
    // Actualiza información de la cuenta del usuario
    async updateAccountInfo(req, res) {
        try {
            const { phone } = req.body;
            const userToken = req.roleUser || req.user;
            if (!userToken || !userToken.email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email not provided in token'
                });
            }
            const user = await user_models_1.default.findOne({ 'primary_data.email': userToken.email });
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
        }
        catch (e) {
            console.error('Error updating account info:', e);
            return res.status(codes_constanst_1.INTERNAL_ERROR).json({
                success: false,
                message: 'Internal Error',
                error: e.message
            });
        }
    }
    // Obtiene el perfil del usuario autenticado
    async getCurrentUserProfile(req, res) {
        try {
            const userToken = req.roleUser || req.user;
            if (!userToken || !userToken.email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email not provided in token'
                });
            }
            const user = await user_models_1.default.findOne({ 'primary_data.email': userToken.email });
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
        }
        catch (e) {
            console.error('Error getting user profile:', e);
            return res.status(codes_constanst_1.INTERNAL_ERROR).json({
                success: false,
                message: 'Internal Error',
                error: e.message
            });
        }
    }
    // Inicia sesión de usuario
    async loginUser(req, res) {
        try {
            console.log('loginUser - req.body:', JSON.stringify(req.body, null, 2));
            console.log('loginUser - iniciando proceso de login');
            const { email, contraseña } = req.body;
            console.log('loginUser - email recibido:', email);
            console.log('loginUser - contraseña recibida:', contraseña ? 'EXISTS' : 'MISSING');
            // Validar que se proporcionen email y contraseña
            if (!email || !contraseña) {
                console.log('loginUser - faltan email o contraseña');
                return res.status(codes_constanst_1.BAD_REQUEST).json({
                    success: false,
                    message: 'Email y contraseña son requeridos'
                });
            }
            // Buscar usuario en la base de datos
            console.log('loginUser - buscando usuario en BD con email:', email.toLowerCase());
            const user = await user_models_1.default.findOne({ 'primary_data.email': email.toLowerCase() });
            console.log('loginUser - resultado de búsqueda:', user ? 'ENCONTRADO' : 'NO ENCONTRADO');
            if (user) {
                console.log('loginUser - user._id:', user._id);
                console.log('loginUser - user.primary_data.email:', user.primary_data.email);
            }
            if (!user) {
                console.log('loginUser - usuario no encontrado');
                return res.status(codes_constanst_1.UNAUTHORIZED).json({
                    success: false,
                    message: 'Credenciales incorrectas'
                });
            }
            console.log('loginUser - usuario encontrado, verificando contraseña...');
            // Verificar contraseña usando bcrypt
            console.log('loginUser - verificando contraseña...');
            const isValidPassword = await bcrypt_1.default.compare(contraseña, user.auth_data.password);
            console.log('loginUser - isValidPassword:', isValidPassword);
            if (!isValidPassword) {
                console.log('loginUser - contraseña incorrecta');
                return res.status(codes_constanst_1.UNAUTHORIZED).json({
                    success: false,
                    message: 'Credenciales incorrectas'
                });
            }
            console.log('loginUser - contraseña válida, verificando estado activo...');
            // Verificar que el usuario esté activo
            if (!user.permissions.active) {
                console.log('loginUser - usuario inactivo');
                return res.status(codes_constanst_1.UNAUTHORIZED).json({
                    success: false,
                    message: 'Usuario inactivo. Contacta al administrador.'
                });
            }
            console.log('loginUser - autenticación exitosa, generando token...');
            // Mapear el tipo de usuario a un rol del sistema
            const getUserRole = (userType) => {
                switch (userType === null || userType === void 0 ? void 0 : userType.toLowerCase()) {
                    case 'super_admin':
                    case 'superadmin':
                        return roles_interface_1.UserRole.ADMIN; // Super admin tiene permisos de admin
                    case 'admin':
                    case 'administrador':
                        return roles_interface_1.UserRole.ADMIN;
                    case 'professional':
                    case 'profesional':
                        return roles_interface_1.UserRole.PROFESSIONAL;
                    case 'autonomous':
                    case 'autonomo':
                    case 'autónomo':
                        return roles_interface_1.UserRole.AUTONOMOUS;
                    case 'dedicated':
                    case 'dedicado':
                        return roles_interface_1.UserRole.DEDICATED;
                    case 'provider':
                    case 'proveedor':
                        return roles_interface_1.UserRole.PROVIDER;
                    case 'moderator':
                    case 'moderador':
                        return roles_interface_1.UserRole.MODERATOR;
                    default:
                        return roles_interface_1.UserRole.USER;
                }
            };
            const userRole = getUserRole(user.primary_data.type);
            // Generar flags basados en el rol del usuario
            const flags = {
                isProvider: userRole === roles_interface_1.UserRole.PROVIDER,
                isProfessional: userRole === roles_interface_1.UserRole.PROFESSIONAL
            };
            // Generar token JWT con información de roles
            const token = jwt.sign({
                id: String(user._id),
                email: user.primary_data.email,
                _id: user._id,
                name: user.primary_data.name,
                role: userRole,
                isActive: user.permissions.active,
                flags: flags
            }, env.JWT_KEY, { expiresIn: '60d' });
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
        }
        catch (error) {
            console.error('loginUser - error:', error);
            return res.status(codes_constanst_1.INTERNAL_ERROR).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}
exports.default = new UserControllers();
//# sourceMappingURL=user.controllers.js.map