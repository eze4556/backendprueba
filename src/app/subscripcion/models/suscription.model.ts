export enum PlanType {
    BASE = 'BASE',
    PREMIUM = 'PREMIUM',
    ENTERPRISE = 'ENTERPRISE'
}

export enum UserType {
    FREELANCE = 'FREELANCE'
}

export enum MemberStatus {
    INVITED = 'INVITED',
    ACTIVE = 'ACTIVE'
}

export interface SubscriptionMember {
    id: string;
    subscriptionId: string;
    userId?: string;
    email: string;
    name: string;
    userType: UserType;
    status: MemberStatus;
    invitedAt: Date;
    activatedAt?: Date;
}

export interface SubscriptionData {
    id: string;
    providerId: string;
    planType: PlanType;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    paymentMethod: string;
    paymentId: string;
    totalMembers: number;
    members: SubscriptionMember[];
}