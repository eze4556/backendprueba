import { Request } from 'express';

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: string;
    flags: {
        isProvider: boolean;
        isProfessional: boolean;
    };
}

export interface IAuthUser {
    id: string;
    email: string;
    role: string;
    flags: {
        isProvider: boolean;
        isProfessional: boolean;
    };
}

export interface IAuthResponse {
    isAuthenticated: boolean;
    isAdmin: boolean;
    isProvider: boolean;
    isProfessional: boolean;
}

export type AuthRequest = Request & {
    user?: IAuthUser;
    auth?: IAuthResponse;
}