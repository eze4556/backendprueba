"use strict";
// Sistema de validación de roles para operaciones sensibles
// Centraliza la gestión de permisos y roles del sistema LikeVendor
Object.defineProperty(exports, "__esModule", { value: true });
exports.SENSITIVE_OPERATIONS = exports.ROLE_PERMISSIONS = exports.Permission = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    // Roles principales del sistema
    UserRole["ADMIN"] = "admin";
    UserRole["PROFESSIONAL"] = "professional";
    UserRole["AUTONOMOUS"] = "autonomous";
    UserRole["DEDICATED"] = "dedicated";
    UserRole["PROVIDER"] = "provider";
    UserRole["USER"] = "user";
    // Roles especiales
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["MODERATOR"] = "moderator";
})(UserRole || (exports.UserRole = UserRole = {}));
var Permission;
(function (Permission) {
    // Permisos de usuarios
    Permission["CREATE_USER"] = "create_user";
    Permission["EDIT_USER"] = "edit_user";
    Permission["DELETE_USER"] = "delete_user";
    Permission["VIEW_USER"] = "view_user";
    Permission["UPDATE_USER_ROLE"] = "update_user_role";
    // Permisos de productos
    Permission["CREATE_PRODUCT"] = "create_product";
    Permission["EDIT_PRODUCT"] = "edit_product";
    Permission["DELETE_PRODUCT"] = "delete_product";
    Permission["VIEW_PRODUCT"] = "view_product";
    Permission["MANAGE_STOCK"] = "manage_stock";
    Permission["BULK_UPDATE_PRODUCTS"] = "bulk_update_products";
    // Permisos financieros
    Permission["CREATE_INVOICE"] = "create_invoice";
    Permission["VIEW_INVOICE"] = "view_invoice";
    Permission["EDIT_INVOICE"] = "edit_invoice";
    Permission["DELETE_INVOICE"] = "delete_invoice";
    Permission["PROCESS_PAYMENT"] = "process_payment";
    Permission["AUTHORIZE_PAYMENT"] = "authorize_payment";
    Permission["CAPTURE_PAYMENT"] = "capture_payment";
    Permission["REFUND_PAYMENT"] = "refund_payment";
    Permission["VIEW_FINANCIAL_REPORTS"] = "view_financial_reports";
    // Permisos de categorías
    Permission["CREATE_CATEGORY"] = "create_category";
    Permission["EDIT_CATEGORY"] = "edit_category";
    Permission["DELETE_CATEGORY"] = "delete_category";
    Permission["VIEW_CATEGORY"] = "view_category";
    // Permisos de proveedores
    Permission["CREATE_PROVIDER"] = "create_provider";
    Permission["EDIT_PROVIDER"] = "edit_provider";
    Permission["DELETE_PROVIDER"] = "delete_provider";
    Permission["VIEW_PROVIDER"] = "view_provider";
    // Permisos de trabajadores
    Permission["CREATE_AUTONOMOUS"] = "create_autonomous";
    Permission["EDIT_AUTONOMOUS"] = "edit_autonomous";
    Permission["DELETE_AUTONOMOUS"] = "delete_autonomous";
    Permission["VIEW_AUTONOMOUS"] = "view_autonomous";
    Permission["CREATE_PROFESSIONAL"] = "create_professional";
    Permission["EDIT_PROFESSIONAL"] = "edit_professional";
    Permission["DELETE_PROFESSIONAL"] = "delete_professional";
    Permission["VIEW_PROFESSIONAL"] = "view_professional";
    Permission["CREATE_DEDICATED"] = "create_dedicated";
    Permission["EDIT_DEDICATED"] = "edit_dedicated";
    Permission["DELETE_DEDICATED"] = "delete_dedicated";
    Permission["VIEW_DEDICATED"] = "view_dedicated";
    // Permisos de vehículos
    Permission["CREATE_VEHICLE"] = "create_vehicle";
    Permission["EDIT_VEHICLE"] = "edit_vehicle";
    Permission["DELETE_VEHICLE"] = "delete_vehicle";
    Permission["VIEW_VEHICLE"] = "view_vehicle";
    Permission["ASSIGN_DRIVER"] = "assign_driver";
    // Permisos administrativos
    Permission["VIEW_SYSTEM_LOGS"] = "view_system_logs";
    Permission["MANAGE_SYSTEM_CONFIG"] = "manage_system_config";
    Permission["ACCESS_ADMIN_PANEL"] = "access_admin_panel";
    Permission["EXPORT_DATA"] = "export_data";
    Permission["IMPORT_DATA"] = "import_data";
    // Permisos de stream/live
    Permission["CREATE_STREAM"] = "create_stream";
    Permission["MANAGE_STREAM"] = "manage_stream";
    Permission["VIEW_STREAM"] = "view_stream";
})(Permission || (exports.Permission = Permission = {}));
// Configuración de permisos por rol
exports.ROLE_PERMISSIONS = {
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
exports.SENSITIVE_OPERATIONS = {
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
};
//# sourceMappingURL=roles.interface.js.map