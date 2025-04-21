import mongoose, { Schema, model } from 'mongoose';

export interface UserInterface extends mongoose.Document {
  primary_data: {
    name: string;
    last_name: string;
    phone: string;
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
  permissions: {
    active: boolean;
    allow_password_change: boolean;
  };
}

const UserSchema = new Schema(
  {
    primary_data: {
      name: { type: String, required: true },
      last_name: { type: String, required: true },
      phone: { type: String, required: true },
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
      doc_number: { type: Number, require: false },
      cuit_cuil: { type: Number, require: false },
      taxpayer_type: { type: String, require: false },
      bussiness_name: { type: String, require: false },
      city_name: { type: String, require: false },
      street_name: { type: String, require: false },
      street_number: { type: Number, require: false },
      state_name: { type: String, require: false },
      zip_code: { type: Number, require: false },
      comment: { type: String, require: false },
    },
    auth_data: {
      password: { type: String, required: true },
    },
    permissions: {
      active: { type: Boolean, default: true, required: true },
      allow_password_change: { type: Boolean, default: false, required: true },
    },
    createdAt: { type: Number, inmutable: true },
    updatedAt: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: true }, versionKey: false }
);

export default model<UserInterface>('users', UserSchema);
