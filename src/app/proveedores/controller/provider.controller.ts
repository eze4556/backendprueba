import { Request, Response } from 'express';
import providerService, { ProviderCategory } from '../servicio/provider.service';

export default class ProviderController {
  private providerService = providerService;

  public registerProvider = async (req: Request, res: Response) => {
    try {
      const { 
        userId, 
        organizationId, 
        name, 
        category, 
        description, 
        contactEmail, 
        contactPhone
      } = req.body;
      
      if (!userId || !organizationId || !name || !category || !contactEmail) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }
      
      if (!Object.values(ProviderCategory).includes(category)) {
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
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  public getAllProviders = async (req: Request, res: Response) => {
    try {
      const providers = await this.providerService.getAllProviders();
      return res.json(providers);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  public getPendingProviders = async (req: Request, res: Response) => {
    try {
      const pendingProviders = await this.providerService.getPendingProviders();
      return res.json(pendingProviders);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  public getProviderById = async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const provider = await this.providerService.getProviderById(providerId);
      
      if (!provider) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }
      
      return res.json(provider);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  public updateProvider = async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const providerData = req.body;
      
      const updatedProvider = await this.providerService.updateProvider(providerId, providerData);
      
      return res.json(updatedProvider);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  public approveProvider = async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const adminId = (req.user as { id: string }).id;
      
      if (!adminId) {
        return res.status(400).json({ error: 'Usuario no identificado' });
      }
      
      const provider = await this.providerService.approveProvider(providerId, adminId);
      
      return res.json(provider);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  public rejectProvider = async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const { reason } = req.body;
      const adminId = (req.user as { id: string }).id;
      
      if (!adminId || !reason) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      const provider = await this.providerService.rejectProvider(providerId, adminId, reason);
      
      return res.json(provider);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  public uploadDocument = async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const { documentType, documentUrl } = req.body;
      
      if (!documentType || !documentUrl) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      const document = await this.providerService.uploadDocument(providerId, documentType, documentUrl);
      
      return res.status(201).json(document);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  public getProviderDocuments = async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      
      const documents = await this.providerService.getProviderDocuments(providerId);
      
      return res.json(documents);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  public verifyDocument = async (req: Request, res: Response) => {
    try {
      const { providerId, documentId } = req.params;
      
      const verifiedDocument = await this.providerService.verifyDocument(providerId, documentId);
      
      return res.json(verifiedDocument);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }
}