import { Schema, model } from 'mongoose';
import { IUser } from '../interfaces/user.interface';

const userSchema = new Schema<IUser>({
    primary_data: {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String }
    },
    role: {
        type: String,
        enum: ['admin', 'professional', 'provider', 'user', 'super_admin'],
        default: 'user'
    },
    flags: {
        isProfessional: { type: Boolean, default: false },
        isProvider: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: false }
    },
    audit: {
        created_at: { type: Date, default: Date.now },
        last_login: { type: Date },
        last_updated: { type: Date }
    },
    preferences: {
        language: { type: String, default: 'es' },
        notifications: { type: Boolean, default: true }
    },
    security: {
        reset_token: String,
        reset_expires: Date,
        last_password_change: Date
    }
});

// Índices
userSchema.index({ 'primary_data.email': 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ 'flags.isProfessional': 1 });
userSchema.index({ 'flags.isProvider': 1 });

// Métodos
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    // Implementar comparación de contraseña
    return true; // TODO: Implementar bcrypt
};

userSchema.methods.canModifyProducts = function(): boolean {
    return this.role === 'admin' || 
           this.flags.isProfessional || 
           this.flags.isProvider;
};

userSchema.methods.isAdmin = function(): boolean {
    return this.role === 'admin';
};

const UserModel = model<IUser>('users', userSchema);

export default UserModel;