"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderService = exports.ProviderCategory = void 0;
const provider_model_1 = require("../models/provider.model");
var ProviderCategory;
(function (ProviderCategory) {
    ProviderCategory["EXAMPLE"] = "EXAMPLE";
    ProviderCategory["ANOTHER"] = "ANOTHER";
})(ProviderCategory || (exports.ProviderCategory = ProviderCategory = {}));
class ProviderService {
    /**
     * Obtiene un proveedor por su ID
     */
    async getProviderById(providerId) {
        try {
            // Aquí iría la consulta a la base de datos
            // Simulación temporal
            if (providerId) {
                return {
                    id: providerId,
                    userId: 'user_123',
                    organizationId: 'org_123',
                    name: 'Proveedor Ejemplo',
                    contactEmail: 'proveedor@ejemplo.com',
                    status: provider_model_1.ProviderStatus.APPROVED,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    documents: [],
                    contactPhone: '+1234567890'
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error al obtener proveedor:', error);
            throw error;
        }
    }
    /**
     * Obtiene un proveedor por usuario y organización
     */
    async getProviderByUserAndOrg(userId, organizationId) {
        try {
            const provider = {
                id: 'provider_' + Math.random().toString(36).substring(2, 15),
                userId,
                organizationId,
                name: 'Proveedor Ejemplo',
                contactEmail: 'proveedor@ejemplo.com',
                status: provider_model_1.ProviderStatus.APPROVED,
                createdAt: new Date(),
                updatedAt: new Date(),
                documents: [],
                category: Object.values(ProviderCategory)[0], // Use first available category
                contactPhone: '+1234567890'
            };
            return provider;
        }
        catch (error) {
            console.error('Error al obtener proveedor:', error);
            throw error;
        }
    }
    /**
     * Actualiza la información de un proveedor
     */
    async updateProvider(providerId, providerData) {
        try {
            // Obtener el proveedor actual
            const provider = await this.getProviderById(providerId);
            if (!provider) {
                throw new Error('Proveedor no encontrado');
            }
            // Actualizar los campos proporcionados
            const updatedProvider = {
                ...provider,
                ...providerData,
                updatedAt: new Date()
            };
            // Aquí iría la lógica para guardar en la base de datos
            return updatedProvider;
        }
        catch (error) {
            console.error('Error al actualizar proveedor:', error);
            throw error;
        }
    }
    /**
     * Obtiene los documentos de un proveedor
     */
    async getProviderDocuments(providerId) {
        try {
            const provider = await this.getProviderById(providerId);
            if (!provider) {
                throw new Error('Proveedor no encontrado');
            }
            return provider.documents || [];
        }
        catch (error) {
            console.error('Error al obtener documentos:', error);
            throw error;
        }
    }
    /**
     * Verifica un documento
     */
    async verifyDocument(providerId, documentId) {
        try {
            const provider = await this.getProviderById(providerId);
            if (!provider) {
                throw new Error('Proveedor no encontrado');
            }
            const document = provider.documents.find(doc => doc.id === documentId);
            if (!document) {
                throw new Error('Documento no encontrado');
            }
            document.isVerified = true;
            document.verifiedAt = new Date();
            // Aquí iría la lógica para guardar en la base de datos
            return document;
        }
        catch (error) {
            console.error('Error al verificar documento:', error);
            throw error;
        }
    }
    /**
     * Verifica si un proveedor está aprobado
     */
    async isProviderApproved(userId, organizationId) {
        try {
            const provider = await this.getProviderByUserAndOrg(userId, organizationId);
            if (!provider) {
                return false;
            }
            return provider.status === provider_model_1.ProviderStatus.APPROVED;
        }
        catch (error) {
            console.error('Error al verificar estado del proveedor:', error);
            return false;
        }
    }
    /**
     * Registra un nuevo proveedor
     */
    async registerProvider(providerData) {
        try {
            // Implementar lógica para crear un nuevo proveedor
            const newProvider = {
                id: 'provider_' + Math.random().toString(36).substring(2, 15),
                userId: providerData.userId,
                organizationId: providerData.organizationId,
                name: providerData.name,
                contactEmail: providerData.contactEmail,
                status: provider_model_1.ProviderStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date(),
                documents: []
            };
            // Aquí iría la lógica para guardar en la base de datos
            return newProvider;
        }
        catch (error) {
            console.error('Error al registrar proveedor:', error);
            throw error;
        }
    }
    /**
     * Obtiene todos los proveedores
     */
    async getAllProviders() {
        try {
            // Simular respuesta
            return [
                {
                    id: 'provider_1',
                    userId: 'user_1',
                    organizationId: 'org_1',
                    name: 'Proveedor 1',
                    contactEmail: 'proveedor1@ejemplo.com',
                    status: provider_model_1.ProviderStatus.APPROVED,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    documents: []
                },
                {
                    id: 'provider_2',
                    userId: 'user_2',
                    organizationId: 'org_1',
                    name: 'Proveedor 2',
                    contactEmail: 'proveedor2@ejemplo.com',
                    status: provider_model_1.ProviderStatus.PENDING,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    documents: []
                }
            ];
        }
        catch (error) {
            console.error('Error al obtener proveedores:', error);
            throw error;
        }
    }
    /**
     * Obtiene proveedores pendientes de aprobación
     */
    async getPendingProviders() {
        try {
            const allProviders = await this.getAllProviders();
            return allProviders.filter(provider => provider.status === provider_model_1.ProviderStatus.PENDING);
        }
        catch (error) {
            console.error('Error al obtener proveedores pendientes:', error);
            throw error;
        }
    }
    /**
     * Aprueba un proveedor
     */
    async approveProvider(providerId, adminId) {
        try {
            const provider = await this.getProviderById(providerId);
            if (!provider) {
                throw new Error('Proveedor no encontrado');
            }
            return this.updateProvider(providerId, { status: provider_model_1.ProviderStatus.APPROVED });
        }
        catch (error) {
            console.error('Error al aprobar proveedor:', error);
            throw error;
        }
    }
    /**
     * Rechaza un proveedor
     */
    async rejectProvider(providerId, adminId, reason) {
        try {
            const provider = await this.getProviderById(providerId);
            if (!provider) {
                throw new Error('Proveedor no encontrado');
            }
            return this.updateProvider(providerId, { status: provider_model_1.ProviderStatus.REJECTED });
        }
        catch (error) {
            console.error('Error al rechazar proveedor:', error);
            throw error;
        }
    }
    /**
     * Sube un documento de proveedor
     */
    async uploadDocument(providerId, documentType, documentUrl) {
        try {
            const provider = await this.getProviderById(providerId);
            if (!provider) {
                throw new Error('Proveedor no encontrado');
            }
            const newDocument = {
                id: 'doc_' + Math.random().toString(36).substring(2, 15),
                type: documentType,
                filename: documentUrl,
                uploadedAt: new Date(),
                isVerified: false
            };
            provider.documents.push(newDocument);
            // Aquí iría la lógica para guardar en la base de datos
            return newDocument;
        }
        catch (error) {
            console.error('Error al subir documento:', error);
            throw error;
        }
    }
}
exports.ProviderService = ProviderService;
exports.default = new ProviderService();
//# sourceMappingURL=provider.service.js.map