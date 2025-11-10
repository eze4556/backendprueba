// Sistema de validación de roles para operaciones sensibles
// Centraliza la gestión de permisos y roles del sistema LikeVendor

export enum UserRole {
  // Roles principales del sistema
  ADMIN = 'admin',
  PROFESSIONAL = 'professional', 
  AUTONOMOUS = 'autonomous',
  DEDICATED = 'dedicated',
  PROVIDER = 'provider',
  USER = 'user',
  // Roles especiales
  SUPER_ADMIN = 'super_admin',
  MODERATOR = 'moderator'
}

export enum Permission {
  // Permisos de usuarios
  CREATE_USER = 'create_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',
  VIEW_USER = 'view_user',
  UPDATE_USER_ROLE = 'update_user_role',
  
  // Permisos de productos
  CREATE_PRODUCT = 'create_product',
  EDIT_PRODUCT = 'edit_product',
  DELETE_PRODUCT = 'delete_product',
  VIEW_PRODUCT = 'view_product',
  MANAGE_STOCK = 'manage_stock',
  BULK_UPDATE_PRODUCTS = 'bulk_update_products',
  
  // Permisos financieros
  CREATE_INVOICE = 'create_invoice',
  VIEW_INVOICE = 'view_invoice',
  EDIT_INVOICE = 'edit_invoice',
  DELETE_INVOICE = 'delete_invoice',
  PROCESS_PAYMENT = 'process_payment',
  AUTHORIZE_PAYMENT = 'authorize_payment',
  CAPTURE_PAYMENT = 'capture_payment',
  REFUND_PAYMENT = 'refund_payment',
  VIEW_FINANCIAL_REPORTS = 'view_financial_reports',
  
  // Permisos de categorías
  CREATE_CATEGORY = 'create_category',
  EDIT_CATEGORY = 'edit_category',
  DELETE_CATEGORY = 'delete_category',
  VIEW_CATEGORY = 'view_category',
  
  // Permisos de proveedores
  CREATE_PROVIDER = 'create_provider',
  EDIT_PROVIDER = 'edit_provider',
  DELETE_PROVIDER = 'delete_provider',
  VIEW_PROVIDER = 'view_provider',
  
  // Permisos de trabajadores
  CREATE_AUTONOMOUS = 'create_autonomous',
  EDIT_AUTONOMOUS = 'edit_autonomous',
  DELETE_AUTONOMOUS = 'delete_autonomous',
  VIEW_AUTONOMOUS = 'view_autonomous',
  
  CREATE_PROFESSIONAL = 'create_professional',
  EDIT_PROFESSIONAL = 'edit_professional',
  DELETE_PROFESSIONAL = 'delete_professional',
  VIEW_PROFESSIONAL = 'view_professional',
  
  CREATE_DEDICATED = 'create_dedicated',
  EDIT_DEDICATED = 'edit_dedicated',
  DELETE_DEDICATED = 'delete_dedicated',
  VIEW_DEDICATED = 'view_dedicated',
  
  // Permisos de vehículos
  CREATE_VEHICLE = 'create_vehicle',
  EDIT_VEHICLE = 'edit_vehicle',
  DELETE_VEHICLE = 'delete_vehicle',
  VIEW_VEHICLE = 'view_vehicle',
  ASSIGN_DRIVER = 'assign_driver',
  
  // Permisos administrativos
  VIEW_SYSTEM_LOGS = 'view_system_logs',
  MANAGE_SYSTEM_CONFIG = 'manage_system_config',
  ACCESS_ADMIN_PANEL = 'access_admin_panel',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
  
  // Permisos de stream/live
  CREATE_STREAM = 'create_stream',
  MANAGE_STREAM = 'manage_stream',
  VIEW_STREAM = 'view_stream'
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description: string;
  level: number; // 1-10, donde 10 es el más alto
}

// Configuración de permisos por rol
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.SUPER_ADMIN]: {
    role: UserRole.SUPER_ADMIN,
    description: 'Acceso completo al sistema',
    level: 10,
    permissions: Object.values(Permission) // Todos los permisos
  },
  
  [UserRole.ADMIN]: {
    role: UserRole.ADMIN,
    description: 'Administrador del sistema',
    level: 9,
    permissions: [
      // Usuarios
      Permission.CREATE_USER,
      Permission.EDIT_USER,
      Permission.DELETE_USER,
      Permission.VIEW_USER,
      Permission.UPDATE_USER_ROLE,
      
      // Productos
      Permission.CREATE_PRODUCT,
      Permission.EDIT_PRODUCT,
      Permission.DELETE_PRODUCT,
      Permission.VIEW_PRODUCT,
      Permission.MANAGE_STOCK,
      Permission.BULK_UPDATE_PRODUCTS,
      
      // Financiero
      Permission.CREATE_INVOICE,
      Permission.VIEW_INVOICE,
      Permission.EDIT_INVOICE,
      Permission.DELETE_INVOICE,
      Permission.PROCESS_PAYMENT,
      Permission.AUTHORIZE_PAYMENT,
      Permission.CAPTURE_PAYMENT,
      Permission.REFUND_PAYMENT,
      Permission.VIEW_FINANCIAL_REPORTS,
      
      // Categorías
      Permission.CREATE_CATEGORY,
      Permission.EDIT_CATEGORY,
      Permission.DELETE_CATEGORY,
      Permission.VIEW_CATEGORY,
      
      // Trabajadores
      Permission.CREATE_AUTONOMOUS,
      Permission.EDIT_AUTONOMOUS,
      Permission.DELETE_AUTONOMOUS,
      Permission.VIEW_AUTONOMOUS,
      Permission.CREATE_PROFESSIONAL,
      Permission.EDIT_PROFESSIONAL,
      Permission.DELETE_PROFESSIONAL,
      Permission.VIEW_PROFESSIONAL,
      Permission.CREATE_DEDICATED,
      Permission.EDIT_DEDICATED,
      Permission.DELETE_DEDICATED,
      Permission.VIEW_DEDICATED,
      
      // Vehículos
      Permission.CREATE_VEHICLE,
      Permission.EDIT_VEHICLE,
      Permission.DELETE_VEHICLE,
      Permission.VIEW_VEHICLE,
      Permission.ASSIGN_DRIVER,
      
      // Proveedores
      Permission.CREATE_PROVIDER,
      Permission.EDIT_PROVIDER,
      Permission.DELETE_PROVIDER,
      Permission.VIEW_PROVIDER,
      
      // Administrativo
      Permission.VIEW_SYSTEM_LOGS,
      Permission.MANAGE_SYSTEM_CONFIG,
      Permission.ACCESS_ADMIN_PANEL,
      Permission.EXPORT_DATA,
      Permission.IMPORT_DATA,
      
      // Stream
      Permission.CREATE_STREAM,
      Permission.MANAGE_STREAM,
      Permission.VIEW_STREAM
    ]
  },
  
  [UserRole.MODERATOR]: {
    role: UserRole.MODERATOR,
    description: 'Moderador con permisos limitados',
    level: 7,
    permissions: [
      Permission.VIEW_USER,
      Permission.EDIT_USER,
      Permission.VIEW_PRODUCT,
      Permission.EDIT_PRODUCT,
      Permission.VIEW_CATEGORY,
      Permission.VIEW_INVOICE,
      Permission.VIEW_AUTONOMOUS,
      Permission.VIEW_PROFESSIONAL,
      Permission.VIEW_DEDICATED,
      Permission.VIEW_PROVIDER,
      Permission.VIEW_VEHICLE,
      Permission.VIEW_STREAM,
      Permission.MANAGE_STREAM
    ]
  },
  
  [UserRole.PROFESSIONAL]: {
    role: UserRole.PROFESSIONAL,
    description: 'Profesional con servicios',
    level: 6,
    permissions: [
      Permission.VIEW_USER,
      Permission.EDIT_USER, // Solo su propio perfil
      Permission.CREATE_PRODUCT,
      Permission.EDIT_PRODUCT, // Solo sus productos
      Permission.DELETE_PRODUCT, // Solo sus productos
      Permission.VIEW_PRODUCT,
      Permission.MANAGE_STOCK, // Solo sus productos
      Permission.VIEW_CATEGORY,
      Permission.CREATE_INVOICE, // Solo para sus servicios
      Permission.VIEW_INVOICE, // Solo sus facturas
      Permission.EDIT_INVOICE, // Solo sus facturas
      Permission.PROCESS_PAYMENT, // Solo sus cobros
      Permission.VIEW_VEHICLE,
      Permission.CREATE_STREAM,
      Permission.MANAGE_STREAM, // Solo sus streams
      Permission.VIEW_STREAM
    ]
  },
  
  [UserRole.PROVIDER]: {
    role: UserRole.PROVIDER,
    description: 'Proveedor de productos',
    level: 5,
    permissions: [
      Permission.VIEW_USER,
      Permission.EDIT_USER, // Solo su propio perfil
      Permission.CREATE_PRODUCT,
      Permission.EDIT_PRODUCT, // Solo sus productos
      Permission.DELETE_PRODUCT, // Solo sus productos
      Permission.VIEW_PRODUCT,
      Permission.MANAGE_STOCK, // Solo sus productos
      Permission.VIEW_CATEGORY,
      Permission.CREATE_INVOICE, // Solo para sus ventas
      Permission.VIEW_INVOICE, // Solo sus facturas
      Permission.EDIT_INVOICE, // Solo sus facturas
      Permission.PROCESS_PAYMENT, // Solo sus cobros
      Permission.VIEW_VEHICLE,
      Permission.CREATE_STREAM,
      Permission.MANAGE_STREAM, // Solo sus streams
      Permission.VIEW_STREAM
    ]
  },
  
  [UserRole.AUTONOMOUS]: {
    role: UserRole.AUTONOMOUS,
    description: 'Trabajador autónomo',
    level: 4,
    permissions: [
      Permission.VIEW_USER,
      Permission.EDIT_USER, // Solo su propio perfil
      Permission.CREATE_PRODUCT, // Servicios limitados
      Permission.EDIT_PRODUCT, // Solo sus servicios
      Permission.VIEW_PRODUCT,
      Permission.VIEW_CATEGORY,
      Permission.CREATE_INVOICE, // Solo para sus servicios
      Permission.VIEW_INVOICE, // Solo sus facturas
      Permission.VIEW_VEHICLE,
      Permission.CREATE_STREAM,
      Permission.VIEW_STREAM
    ]
  },
  
  [UserRole.DEDICATED]: {
    role: UserRole.DEDICATED,
    description: 'Trabajador dedicado',
    level: 3,
    permissions: [
      Permission.VIEW_USER,
      Permission.EDIT_USER, // Solo su propio perfil
      Permission.VIEW_PRODUCT,
      Permission.VIEW_CATEGORY,
      Permission.VIEW_INVOICE, // Solo sus facturas
      Permission.VIEW_VEHICLE,
      Permission.VIEW_STREAM
    ]
  },
  
  [UserRole.USER]: {
    role: UserRole.USER,
    description: 'Usuario final básico',
    level: 1,
    permissions: [
      Permission.VIEW_USER, // Solo su propio perfil
      Permission.EDIT_USER, // Solo su propio perfil
      Permission.VIEW_PRODUCT,
      Permission.VIEW_CATEGORY,
      Permission.VIEW_STREAM
    ]
  }
};

// Operaciones sensibles que requieren validación especial
export const SENSITIVE_OPERATIONS = {
  // Operaciones financieras críticas
  FINANCIAL_CRITICAL: [
    Permission.AUTHORIZE_PAYMENT,
    Permission.CAPTURE_PAYMENT,
    Permission.REFUND_PAYMENT,
    Permission.CREATE_INVOICE,
    Permission.VIEW_FINANCIAL_REPORTS
  ],
  
  // Operaciones de administración de usuarios
  USER_MANAGEMENT: [
    Permission.CREATE_USER,
    Permission.DELETE_USER,
    Permission.UPDATE_USER_ROLE
  ],
  
  // Operaciones de sistema
  SYSTEM_ADMIN: [
    Permission.VIEW_SYSTEM_LOGS,
    Permission.MANAGE_SYSTEM_CONFIG,
    Permission.ACCESS_ADMIN_PANEL,
    Permission.EXPORT_DATA,
    Permission.IMPORT_DATA
  ],
  
  // Operaciones de modificación masiva
  BULK_OPERATIONS: [
    Permission.BULK_UPDATE_PRODUCTS,
    Permission.DELETE_PRODUCT,
    Permission.DELETE_CATEGORY
  ]
} as const;

export type SensitiveOperationType = keyof typeof SENSITIVE_OPERATIONS;