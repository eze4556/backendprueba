import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show'
}

export interface ReservationInterface extends Document {
  userId: ObjectId;
  professionalId: ObjectId;
  serviceType: string;
  date: Date;
  duration: number; // en minutos
  status: ReservationStatus;
  price: number;
  notes?: string;
  cancellationReason?: string;
  reminderSent24h: boolean;
  reminderSent1h: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<ReservationInterface>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    professionalId: {
      type: Schema.Types.ObjectId,
      ref: 'Professional',
      required: true,
      index: true
    },
    serviceType: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 480 // máximo 8 horas
    },
    status: {
      type: String,
      enum: Object.values(ReservationStatus),
      default: ReservationStatus.PENDING
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    notes: {
      type: String,
      maxlength: 500
    },
    cancellationReason: {
      type: String,
      maxlength: 500
    },
    reminderSent24h: {
      type: Boolean,
      default: false
    },
    reminderSent1h: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Índice compuesto para consultas de disponibilidad
ReservationSchema.index({ professionalId: 1, date: 1, status: 1 });

export default mongoose.model<ReservationInterface>('Reservation', ReservationSchema);
