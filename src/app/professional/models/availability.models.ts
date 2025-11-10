import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
  isAvailable: boolean;
}

export interface DayAvailability {
  dayOfWeek: number; // 0-6 (domingo a sábado)
  isWorking: boolean;
  slots: TimeSlot[];
}

export interface AvailabilityInterface extends Document {
  professionalId: ObjectId;
  timezone: string; // e.g., "America/Argentina/Buenos_Aires"
  schedule: DayAvailability[];
  blockedDates: Date[]; // Días específicos bloqueados (vacaciones, etc.)
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new Schema<TimeSlot>(
  {
    start: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ // HH:mm format
    },
    end: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const DayAvailabilitySchema = new Schema<DayAvailability>(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6
    },
    isWorking: {
      type: Boolean,
      default: true
    },
    slots: [TimeSlotSchema]
  },
  { _id: false }
);

const AvailabilitySchema = new Schema<AvailabilityInterface>(
  {
    professionalId: {
      type: Schema.Types.ObjectId,
      ref: 'Professional',
      required: true,
      unique: true,
      index: true
    },
    timezone: {
      type: String,
      required: true,
      default: 'America/Argentina/Buenos_Aires'
    },
    schedule: {
      type: [DayAvailabilitySchema],
      required: true,
      validate: {
        validator: function(schedule: DayAvailability[]) {
          return schedule.length === 7;
        },
        message: 'Schedule must have 7 days'
      }
    },
    blockedDates: {
      type: [Date],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<AvailabilityInterface>('Availability', AvailabilitySchema);
