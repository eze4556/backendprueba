import mongoose, { Schema, model, Document } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';

export interface UserInterface extends Document, Omit<JwtPayload, 'id'> {
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
  role?: string; // Add role property
}