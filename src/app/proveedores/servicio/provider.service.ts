import { Provider, ProviderStatus, ProviderDocument } from '../models/provider.model';

export enum ProviderCategory {
  EXAMPLE = 'EXAMPLE',
  ANOTHER = 'ANOTHER'
}

export class ProviderService {
  /**
   * Obtiene un proveedor por su ID
   */
  public async getProviderById(providerId: string): Promise<Provider & { contactPhone?: string } | null> {
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
          status: ProviderStatus.APPROVED,
          createdAt: new Date(),
          updatedAt: new Date(),
          documents: [],
          contactPhone: '+1234567890'
        };
      }
      return null;
    } catch (error) {
      console.error('Error al obtener proveedor:', error);
      throw error;
    }
  }

  /**
   * Obtiene un proveedor por usuario y organización
   */
  public async getProviderByUserAndOrg(userId: string, organizationId: string): Promise<Provider & { contactPhone?: string, category: ProviderCategory }> {
    try {
      const provider: Provider & { contactPhone?: string, category: ProviderCategory } = {
        id: 'provider_' + Math.random().toString(36).substring(2, 15),
        userId,
        organizationId,
        name: 'Proveedor Ejemplo',
        contactEmail: 'proveedor@ejemplo.com',
        status: ProviderStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
        documents: [],
        category: Object.values(ProviderCategory)[0] as ProviderCategory, // Use first available category
        contactPhone: '+1234567890'
      } as unknown as Provider & { contactPhone?: string, category: ProviderCategory };
      return provider;
    } catch (error) {
      console.error('Error al obtener proveedor:', error);
      throw error;
    }
  }

  /**
   * Actualiza la información de un proveedor
   */
  public async updateProvider(providerId: string, providerData: Partial<Provider>): Promise<Provider> {
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
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      throw error;
    }
  }

  /**
   * Obtiene los documentos de un proveedor
   */
  public async getProviderDocuments(providerId: string): Promise<ProviderDocument[]> {
    try {
      const provider = await this.getProviderById(providerId);
      
      if (!provider) {
        throw new Error('Proveedor no encontrado');
      }
      
      return provider.documents || [];
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      throw error;
    }
  }

  /**
   * Verifica un documento
   */
  public async verifyDocument(providerId: string, documentId: string): Promise<ProviderDocument> {
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
    } catch (error) {
      console.error('Error al verificar documento:', error);
      throw error;
    }
  }

  /**
   * Verifica si un proveedor está aprobado
   */
  public async isProviderApproved(userId: string, organizationId: string): Promise<boolean> {
    try {
      const provider = await this.getProviderByUserAndOrg(userId, organizationId);
      
      if (!provider) {
        return false;
      }
      
      return (provider as Provider).status === ProviderStatus.APPROVED;
    } catch (error) {
      console.error('Error al verificar estado del proveedor:', error);
      return false;
    }
  }

  /**
   * Registra un nuevo proveedor
   */
  public async registerProvider(providerData: any): Promise<Provider> {
    try {
      // Implementar lógica para crear un nuevo proveedor
      const newProvider: Provider = {
        id: 'provider_' + Math.random().toString(36).substring(2, 15),
        userId: providerData.userId,
        organizationId: providerData.organizationId,
        name: providerData.name,
        contactEmail: providerData.contactEmail,
        status: ProviderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        documents: []
      };

      // Aquí iría la lógica para guardar en la base de datos

      return newProvider;
    } catch (error) {
      console.error('Error al registrar proveedor:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los proveedores
   */
  public async getAllProviders(): Promise<Provider[]> {
    try {
      // Simular respuesta
      return [
        {
          id: 'provider_1',
          userId: 'user_1',
          organizationId: 'org_1',
          name: 'Proveedor 1',
          contactEmail: 'proveedor1@ejemplo.com',
          status: ProviderStatus.APPROVED,
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
          status: ProviderStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          documents: []
        }
      ];
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      throw error;
    }
  }

  /**
   * Obtiene proveedores pendientes de aprobación
   */
  public async getPendingProviders(): Promise<Provider[]> {
    try {
      const allProviders = await this.getAllProviders();
      return allProviders.filter(provider => provider.status === ProviderStatus.PENDING);
    } catch (error) {
      console.error('Error al obtener proveedores pendientes:', error);
      throw error;
    }
  }

  /**
   * Aprueba un proveedor
   */
  public async approveProvider(providerId: string, adminId: string): Promise<Provider> {
    try {
      const provider = await this.getProviderById(providerId);
      
      if (!provider) {
        throw new Error('Proveedor no encontrado');
      }
      
      return this.updateProvider(providerId, { status: ProviderStatus.APPROVED });
    } catch (error) {
      console.error('Error al aprobar proveedor:', error);
      throw error;
    }
  }

  /**
   * Rechaza un proveedor
   */
  public async rejectProvider(providerId: string, adminId: string, reason: string): Promise<Provider> {
    try {
      const provider = await this.getProviderById(providerId);
      
      if (!provider) {
        throw new Error('Proveedor no encontrado');
      }
      
      return this.updateProvider(providerId, { status: ProviderStatus.REJECTED });
    } catch (error) {
      console.error('Error al rechazar proveedor:', error);
      throw error;
    }
  }

  /**
   * Sube un documento de proveedor
   */
  public async uploadDocument(providerId: string, documentType: string, documentUrl: string): Promise<ProviderDocument> {
    try {
      const provider = await this.getProviderById(providerId);
      
      if (!provider) {
        throw new Error('Proveedor no encontrado');
      }
      
      const newDocument: ProviderDocument = {
        id: 'doc_' + Math.random().toString(36).substring(2, 15),
        type: documentType,
        filename: documentUrl,
        uploadedAt: new Date(),
        isVerified: false
      };
      
      provider.documents.push(newDocument);
      
      // Aquí iría la lógica para guardar en la base de datos
      
      return newDocument;
    } catch (error) {
      console.error('Error al subir documento:', error);
      throw error;
    }
  }
}

export default new ProviderService();