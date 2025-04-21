export enum PlanType {
    BASE = 'base',
    INTERMEDIATE = 'intermediate',
    GOLD = 'gold'
  }
  
  export enum UserType {
    AUTONOMOUS = 'autonomous',
    DEDICATED = 'dedicated',
    PROFESSIONAL= 'profesional'
  }
  
  export interface SubscriptionPlan {
    id: string;
    type: PlanType;
    name: string;
    maxUsers: number;
    price: number;
    description: string;
    features: string[];
  }
  
  // Planes predefinidos
  export const SUBSCRIPTION_PLANS: Record<PlanType, SubscriptionPlan> = {
    [PlanType.BASE]: {
      id: 'plan_base',
      type: PlanType.BASE,
      name: 'Plan Base',
      maxUsers: 5,
      price: 9.99,
      description: 'Plan básico para equipos pequeños',
      features: [
        'Acceso básico',
        'Soporte por email',
        'Máximo 5 usuarios'
      ],
    },
    [PlanType.INTERMEDIATE]: {
      id: 'plan_intermediate',
      type: PlanType.INTERMEDIATE,
      name: 'Plan Intermedio',
      maxUsers: 15,
      price: 19.99,
      description: 'Plan ideal para equipos en crecimiento',
      features: [
        'Todas las características del plan base',
        'Soporte prioritario',
        'Máximo 15 usuarios',
        'Funcionalidades avanzadas'
      ],
    },
    [PlanType.GOLD]: {
      id: 'plan_gold',
      type: PlanType.GOLD,
      name: 'Plan Gold',
      maxUsers: 30,
      price: 39.99,
      description: 'Solución completa para empresas grandes',
      features: [
        'Todas las características del plan intermedio',
        'Soporte 24/7',
        'Máximo 30 usuarios',
        'Funcionalidades premium',
        'Acceso a API avanzada'
      ],
    }
  };