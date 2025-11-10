"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const provider_middleware_1 = __importDefault(require("../middleware/provider.middleware"));
const provider_controller_1 = __importDefault(require("../controller/provider.controller"));
const router = (0, express_1.Router)();
const providerController = new provider_controller_1.default();
/**
 * @route   POST /api/providers
 * @desc    Registrar un nuevo proveedor
 * @access  Private
 */
router.post('/', (req, res) => {
    providerController.registerProvider(req, res);
});
/**
 * @route   GET /api/providers
 * @desc    Obtener todos los proveedores
 * @access  Admin
 */
router.get('/', (req, res) => {
    providerController.getAllProviders(req, res);
});
/**
 * @route   GET /api/providers/pending
 * @desc    Obtener proveedores pendientes de aprobación
 * @access  Admin
 */
router.get('/pending', (req, res) => {
    providerController.getPendingProviders(req, res);
});
/**
 * @route   GET /api/providers/:providerId
 * @desc    Obtener un proveedor por ID
 * @access  Private (Provider/Admin)
 */
router.get('/:providerId', (req, res, next) => provider_middleware_1.default.isProviderOrAdmin(req, res, next), (req, res) => {
    providerController.getProviderById(req, res);
});
/**
 * @route   PUT /api/providers/:providerId
 * @desc    Actualizar información de un proveedor
 * @access  Private (Provider/Admin)
 */
router.put('/:providerId', (req, res, next) => provider_middleware_1.default.isProviderOrAdmin(req, res, next), (req, res) => {
    providerController.updateProvider(req, res);
});
/**
 * @route   POST /api/providers/:providerId/approve
 * @desc    Aprobar un proveedor
 * @access  Admin
 */
router.post('/:providerId/approve', (req, res) => {
    providerController.approveProvider(req, res);
});
/**
 * @route   POST /api/providers/:providerId/reject
 * @desc    Rechazar un proveedor
 * @access  Admin
 */
router.post('/:providerId/reject', (req, res) => {
    providerController.rejectProvider(req, res);
});
/**
 * @route   POST /api/providers/:providerId/documents
 * @desc    Subir documentos de verificación
 * @access  Private (Provider)
 */
router.post('/:providerId/documents', (req, res, next) => provider_middleware_1.default.isProviderOrAdmin(req, res, next), (req, res) => {
    providerController.uploadDocument(req, res);
});
/**
 * @route   GET /api/providers/:providerId/documents
 * @desc    Obtener documentos de un proveedor
 * @access  Private (Provider/Admin)
 */
router.get('/:providerId/documents', (req, res, next) => provider_middleware_1.default.isProviderOrAdmin(req, res, next), (req, res) => {
    providerController.getProviderDocuments(req, res);
});
/**
 * @route   POST /api/providers/:providerId/documents/:documentId/verify
 * @desc    Verificar un documento (admin)
 * @access  Admin
 */
router.post('/:providerId/documents/:documentId/verify', (req, res) => {
    providerController.verifyDocument(req, res);
});
exports.default = router;
//# sourceMappingURL=provider.routes.js.map