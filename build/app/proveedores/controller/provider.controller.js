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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const provider_service_1 = __importStar(require("../servicio/provider.service"));
class ProviderController {
    constructor() {
        this.providerService = provider_service_1.default;
        this.registerProvider = async (req, res) => {
            try {
                const { userId, organizationId, name, category, description, contactEmail, contactPhone } = req.body;
                if (!userId || !organizationId || !name || !category || !contactEmail) {
                    return res.status(400).json({ error: 'Faltan campos requeridos' });
                }
                if (!Object.values(provider_service_1.ProviderCategory).includes(category)) {
                    return res.status(400).json({ error: 'Categoría de proveedor no válida' });
                }
                const provider = await this.providerService.registerProvider({
                    userId,
                    organizationId,
                    name,
                    category,
                    description,
                    contactEmail,
                    contactPhone,
                    documents: []
                });
                return res.status(201).json(provider);
            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        };
        this.getAllProviders = async (req, res) => {
            try {
                const providers = await this.providerService.getAllProviders();
                return res.json(providers);
            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        };
        this.getPendingProviders = async (req, res) => {
            try {
                const pendingProviders = await this.providerService.getPendingProviders();
                return res.json(pendingProviders);
            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        };
        this.getProviderById = async (req, res) => {
            try {
                const { providerId } = req.params;
                const provider = await this.providerService.getProviderById(providerId);
                if (!provider) {
                    return res.status(404).json({ error: 'Proveedor no encontrado' });
                }
                return res.json(provider);
            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        };
        this.updateProvider = async (req, res) => {
            try {
                const { providerId } = req.params;
                const providerData = req.body;
                const updatedProvider = await this.providerService.updateProvider(providerId, providerData);
                return res.json(updatedProvider);
            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        };
        this.approveProvider = async (req, res) => {
            try {
                const { providerId } = req.params;
                const adminId = req.user.id;
                if (!adminId) {
                    return res.status(400).json({ error: 'Usuario no identificado' });
                }
                const provider = await this.providerService.approveProvider(providerId, adminId);
                return res.json(provider);
            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        };
        this.rejectProvider = async (req, res) => {
            try {
                const { providerId } = req.params;
                const { reason } = req.body;
                const adminId = req.user.id;
                if (!adminId || !reason) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                const provider = await this.providerService.rejectProvider(providerId, adminId, reason);
                return res.json(provider);
            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        };
        this.uploadDocument = async (req, res) => {
            try {
                const { providerId } = req.params;
                const { documentType, documentUrl } = req.body;
                if (!documentType || !documentUrl) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                const document = await this.providerService.uploadDocument(providerId, documentType, documentUrl);
                return res.status(201).json(document);
            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        };
        this.getProviderDocuments = async (req, res) => {
            try {
                const { providerId } = req.params;
                const documents = await this.providerService.getProviderDocuments(providerId);
                return res.json(documents);
            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        };
        this.verifyDocument = async (req, res) => {
            try {
                const { providerId, documentId } = req.params;
                const verifiedDocument = await this.providerService.verifyDocument(providerId, documentId);
                return res.json(verifiedDocument);
            }
            catch (error) {
                return res.status(400).json({ error: error.message });
            }
        };
    }
}
exports.default = ProviderController;
//# sourceMappingURL=provider.controller.js.map