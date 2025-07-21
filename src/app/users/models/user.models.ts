import mongoose, { Schema, model } from 'mongoose';

export interface UserInterface extends mongoose.Document {
  primary_data: {
    name: string;
    last_name: string;
    phone?: string;
    email: string;
    nickname: string;
    type: string;
    description: string;
  };
  billing_data: {
    doc_number: number;
    cuit_cuil: number;
    taxpayer_type: string;
    bussiness_name: string;
    city_name: string;
    street_name: string;
    street_number: number;
    state_name: string;
    zip_code: number;
    comment: string;
  };
  auth_data: {
    password: string;
  };
  personal_info?: {
    dni: string;
    areaCode: string;
    phone: string;
    location: string;
    birthDate: string;
    receiveNews: boolean;
  };
  permissions: {
    active: boolean;
    allow_password_change: boolean;
  };
  profile_image?: string;
  createdAt?: number;
  updatedAt?: number;
}

const UserSchema = new Schema<UserInterface>(
  {
    primary_data: {
      name: { type: String, required: true },
      last_name: { type: String, required: true },
      phone: { type: String, required: false },
      email: {
        type: String,
        lowercase: true,
        required: [true, "can't be blank"],
        match: [/\S+@\S+\.\S+/, 'is invalid'],
      },
      nickname: { type: String, required: true },
      type: { type: String, required: true },
      description: { type: String, required: true },
    },
    billing_data: {
      doc_number: { type: Number, required: false },
      cuit_cuil: { type: Number, required: false },
      taxpayer_type: { type: String, required: false },
      bussiness_name: { type: String, required: false },
      city_name: { type: String, required: false },
      street_name: { type: String, required: false },
      street_number: { type: Number, required: false },
      state_name: { type: String, required: false },
      zip_code: { type: Number, required: false },
      comment: { type: String, required: false },
    },
    auth_data: {
      password: { type: String, required: true },
    },
    personal_info: {
      dni: { type: String, required: false },
      areaCode: { type: String, required: false },
      phone: { type: String, required: false },
      location: { type: String, required: false },
      birthDate: { type: String, required: false },
      receiveNews: { type: Boolean, default: false }
    },
    permissions: {
      active: { type: Boolean, default: true, required: true },
      allow_password_change: { type: Boolean, default: false, required: true },
    },
    profile_image: { type: String, required: false },
    createdAt: { type: Number, immutable: true },
    updatedAt: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: true }, versionKey: false }
);

export default model<UserInterface>('users', UserSchema);