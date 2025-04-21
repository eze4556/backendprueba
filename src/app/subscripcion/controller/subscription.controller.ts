import { Request, Response } from 'express';
import { SubscriptionService } from '../service/subscription.service';
import { PlanType, UserType } from '../models/suscription.model';

export default class SubscriptionController {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  // ============================================
  // PLANES
  // ============================================

  public getAllPlans = async (req: Request, res: Response) => {
    try {
      const plans = await Promise.all(
        Object.values(PlanType).map(planType => this.subscriptionService.getPlanDetails(planType))
      );
      
      return res.json(plans);
    } catch (error) {
      console.error("Error in getAllPlans:", error);
      return res.status(500).json({ error: 'Failed to retrieve all plans' });
    }
  }

  public getPlanDetails = async (req: Request, res: Response) => {
    try {
      const planType = req.params.planType as PlanType;
      if (!Object.values(PlanType).includes(planType)) {
        return res.status(400).json({ error: 'Tipo de plan no válido' });
      }
      
      const plan = await this.subscriptionService.getPlanDetails(planType);
      return res.json(plan);
    } catch (error) {
      console.error("Error in getPlanDetails:", error);
      return res.status(500).json({ error: 'Failed to retrieve plan details' });
    }
  }

  // ============================================
  // SUSCRIPCIONES DE PROVEEDORES
  // ============================================

  public subscribeProvider = async (req: Request, res: Response) => {
    try {
      const { providerId, planType, paymentMethod, paymentData } = req.body;
      
      if (!providerId || !planType || !paymentMethod || !paymentData) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      const subscription = await this.subscriptionService.subscribeProvider(
        providerId,
        planType,
        paymentMethod,
        paymentData
      );
      
      return res.status(201).json(subscription);
    } catch (error) {
      console.error("Error in subscribeProvider:", error);
      return res.status(500).json({ error: 'Failed to subscribe provider' });
    }
  }

  public getProviderSubscriptions = async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      
      if (!providerId) {
        return res.status(400).json({ error: 'ID de proveedor requerido' });
      }
      
      const subscriptions = await this.subscriptionService.getProviderSubscriptions(providerId);
      
      return res.json(subscriptions);
    } catch (error) {
      console.error("Error in getProviderSubscriptions:", error);
      return res.status(500).json({ error: 'Failed to retrieve provider subscriptions' });
    }
  }

  public getSubscriptionDetails = async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;
      const { providerId } = req.query;
      
      if (!subscriptionId || !providerId) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      const subscription = await this.subscriptionService.getSubscriptionDetails(
        providerId as string,
        subscriptionId
      );
      
      return res.json(subscription);
    } catch (error) {
      console.error("Error in getSubscriptionDetails:", error);
      return res.status(500).json({ error: 'Failed to retrieve subscription details' });
    }
  }

  public changePlan = async (req: Request, res: Response) => {
    try {
      const { providerId, subscriptionId, newPlanType, paymentMethod, paymentData } = req.body;
      
      if (!providerId || !subscriptionId || !newPlanType || !paymentMethod || !paymentData) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      const updatedSubscription = await this.subscriptionService.changePlan(
        providerId,
        subscriptionId,
        newPlanType,
        paymentMethod,
        paymentData
      );
      
      return res.json(updatedSubscription);
    } catch (error) {
      console.error("Error in changePlan:", error);
      return res.status(500).json({ error: 'Failed to change plan' });
    }
  }

  public cancelSubscription = async (req: Request, res: Response) => {
    try {
      const { providerId, subscriptionId } = req.body;
      
      if (!providerId || !subscriptionId) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      const result = await this.subscriptionService.cancelSubscription(providerId, subscriptionId);
      
      return res.json({ success: result, message: 'Suscripción cancelada correctamente' });
    } catch (error) {
      console.error("Error in cancelSubscription:", error);
      return res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }

  public renewSubscription = async (req: Request, res: Response) => {
    try {
      const { providerId, subscriptionId, paymentMethod, paymentData } = req.body;
      
      if (!providerId || !subscriptionId || !paymentMethod || !paymentData) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      const renewedSubscription = await this.subscriptionService.renewSubscription(
        providerId,
        subscriptionId,
        paymentMethod,
        paymentData
      );
      
      return res.json(renewedSubscription);
    } catch (error) {
      console.error("Error in renewSubscription:", error);
      return res.status(500).json({ error: 'Failed to renew subscription' });
    }
  }

  // ============================================
  // GESTIÓN DE MIEMBROS
  // ============================================

  public inviteMember = async (req: Request, res: Response) => {
    try {
      const { providerId, subscriptionId, email, name, userType } = req.body;
      
      if (!providerId || !subscriptionId || !email || !name || !userType) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      if (!Object.values(UserType).includes(userType)) {
        return res.status(400).json({ error: 'Tipo de usuario no válido' });
      }
      
      const member = await this.subscriptionService.inviteMember(
        subscriptionId,
        providerId,
        email,
        name,
        userType
      );
      
      return res.status(201).json(member);
    } catch (error) {
      console.error("Error in inviteMember:", error);
      return res.status(500).json({ error: 'Failed to invite member' });
    }
  }

  public activateMember = async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const { userId } = req.body;
      
      if (!memberId || !userId) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      const member = await this.subscriptionService.activateMember(memberId, userId);
      
      return res.json(member);
    } catch (error) {
      console.error("Error in activateMember:", error);
      return res.status(500).json({ error: 'Failed to activate member' });
    }
  }

  public deactivateMember = async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const { providerId } = req.body;
      
      if (!memberId || !providerId) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      const member = await this.subscriptionService.deactivateMember(providerId, memberId);
      
      return res.json(member);
    } catch (error) {
      console.error("Error in deactivateMember:", error);
      return res.status(500).json({ error: 'Failed to deactivate member' });
    }
  }

  public changeUserType = async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;
      const { providerId, userType } = req.body;
      
      if (!memberId || !providerId || !userType) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      if (!Object.values(UserType).includes(userType)) {
        return res.status(400).json({ error: 'Tipo de usuario no válido' });
      }
      
      const member = await this.subscriptionService.changeUserType(providerId, memberId, userType);
      
      return res.json(member);
    } catch (error) {
      console.error("Error in changeUserType:", error);
      return res.status(500).json({ error: 'Failed to change user type' });
    }
  }

  public getSubscriptionMembers = async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;
      const { providerId } = req.query;
      
      if (!subscriptionId || !providerId) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      
      const members = await this.subscriptionService.getSubscriptionMembers(
        providerId as string,
        subscriptionId
      );
      
      return res.json(members);
    } catch (error) {
      console.error("Error in getSubscriptionMembers:", error);
      return res.status(500).json({ error: 'Failed to retrieve subscription members' });
    }
  }

  public getUserInvitations = async (req: Request, res: Response) => {
    try {
      // Check if req.user is defined and has the necessary properties
      const userId = (req.user as any)?.id;
      const email = (req.user as any)?.email;
  
      if (!userId || !email) {
          console.warn("User ID or email not found in request.user. Ensure auth middleware is correctly populating req.user.");
          return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      const invitations = await this.subscriptionService.getUserInvitations(email);
      
      return res.json(invitations);
    } catch (error) {
      console.error("Error in getUserInvitations:", error);
      return res.status(500).json({ error: 'Failed to retrieve user invitations' });
    }
  }

  public getUserActiveSubscription = async (req: Request, res: Response) => {
    try {
       // Check if req.user is defined and has the necessary properties
       const userId = (req.user as any)?.id;
  
       if (!userId) {
           console.warn("User ID not found in request.user. Ensure auth middleware is correctly populating req.user.");
           return res.status(401).json({ error: 'Usuario no autenticado' });
       }
      
      const subscription = await this.subscriptionService.getUserActiveSubscription(userId);
      
      return res.json(subscription);
    } catch (error) {
      console.error("Error in getUserActiveSubscription:", error);
      return res.status(500).json({ error: 'Failed to retrieve user active subscription' });
    }
  }
}