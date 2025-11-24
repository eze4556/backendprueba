import { Document } from 'mongoose';

export interface IUser extends Document {
    primary_data: {
        name: string;
        email: string;
        password: string;
        phone?: string;
    };
    role: 'admin' | 'professional' | 'provider' | 'user' | 'super_admin';
    flags: {
        isProfessional: boolean;
        isProvider: boolean;
        isVerified: boolean;
    };
    audit: {
        created_at: Date;
        last_login?: Date;
        last_updated?: Date;
    };
    preferences: {
        language: string;
        notifications: boolean;
    };
    security: {
        reset_token?: string;
        reset_expires?: Date;
        last_password_change?: Date;
    };

    // Métodos
    comparePassword(candidatePassword: string): Promise<boolean>;
    canModifyProducts(): boolean;
    isAdmin(): boolean;
}

// Interfaz para los datos autenticados del usuario
export interface AuthenticatedUser {
    id: string;
    email: string;
    role: string;
    flags: {
        isProfessional: boolean;
        isProvider: boolean;
    };
}