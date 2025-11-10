"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reservation_models_1 = __importStar(require("../models/reservation.models"));
const availability_models_1 = __importDefault(require("../models/availability.models"));
const professional_models_1 = __importDefault(require("../models/professional.models"));
const notification_service_1 = __importDefault(require("../../users/services/notification.service"));
const notification_models_1 = require("../../users/models/notification.models");
const nodemailer_1 = __importDefault(require("nodemailer"));
const email_config_1 = require("../../../config/email.config");
class ReservationService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport(email_config_1.emailConfig);
    }
    /**
     * Crear una nueva reserva
     */
    async createReservation(userId, professionalId, serviceType, date, duration, price, notes) {
        // Verificar que el profesional existe
        const professional = await professional_models_1.default.findById(professionalId);
        if (!professional) {
            throw new Error('Professional not found');
        }
        // Verificar disponibilidad
        const isAvailable = await this.checkAvailability(professionalId, date, duration);
        if (!isAvailable) {
            throw new Error('Selected time slot is not available');
        }
        // Crear la reserva
        const reservation = await reservation_models_1.default.create({
            userId,
            professionalId,
            serviceType,
            date,
            duration,
            price,
            notes,
            status: reservation_models_1.ReservationStatus.PENDING
        });
        // Poblar datos
        await reservation.populate('professionalId', 'name profession');
        await reservation.populate('userId', 'name email');
        // Enviar notificación al usuario
        await notification_service_1.default.createNotification({
            userId,
            type: notification_models_1.NotificationType.RESERVATION_CONFIRMED,
            title: 'Reserva creada',
            message: `Tu reserva con ${professional.name} ha sido creada`,
            actionUrl: `/reservations/${reservation._id}`
        });
        // Enviar email de confirmación
        await this.sendReservationEmail(reservation, 'created');
        return reservation;
    }
    /**
     * Verificar disponibilidad para una fecha y duración
     */
    async checkAvailability(professionalId, date, duration) {
        const endTime = new Date(date.getTime() + duration * 60000);
        // Buscar reservas existentes que se solapen
        const overlappingReservations = await reservation_models_1.default.find({
            professionalId,
            status: { $in: [reservation_models_1.ReservationStatus.PENDING, reservation_models_1.ReservationStatus.CONFIRMED] },
            $or: [
                {
                    // La nueva reserva empieza durante una existente
                    date: { $lte: date },
                    $expr: {
                        $gte: [
                            { $add: ['$date', { $multiply: ['$duration', 60000] }] },
                            date
                        ]
                    }
                },
                {
                    // La nueva reserva termina durante una existente
                    date: { $lte: endTime },
                    $expr: {
                        $gte: [
                            { $add: ['$date', { $multiply: ['$duration', 60000] }] },
                            endTime
                        ]
                    }
                },
                {
                    // La nueva reserva engloba una existente
                    date: { $gte: date, $lte: endTime }
                }
            ]
        });
        return overlappingReservations.length === 0;
    }
    /**
     * Obtener disponibilidad de un profesional para un rango de fechas
     */
    async getAvailability(professionalId, startDate, endDate) {
        const availability = await availability_models_1.default.findOne({ professionalId });
        if (!availability) {
            throw new Error('Availability not configured for this professional');
        }
        // Obtener todas las reservas en el rango
        const reservations = await reservation_models_1.default.find({
            professionalId,
            date: { $gte: startDate, $lte: endDate },
            status: { $in: [reservation_models_1.ReservationStatus.PENDING, reservation_models_1.ReservationStatus.CONFIRMED] }
        });
        const availableSlots = [];
        // Generar slots disponibles día por día
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            const daySchedule = availability.schedule.find(s => s.dayOfWeek === dayOfWeek);
            if (daySchedule && daySchedule.isWorking) {
                // Verificar si el día no está bloqueado
                const isBlocked = availability.blockedDates.some(blocked => blocked.toDateString() === currentDate.toDateString());
                if (!isBlocked) {
                    // Generar slots para este día
                    for (const slot of daySchedule.slots) {
                        if (slot.isAvailable) {
                            const [startHour, startMinute] = slot.start.split(':').map(Number);
                            const slotDate = new Date(currentDate);
                            slotDate.setHours(startHour, startMinute, 0, 0);
                            // Verificar si hay reservas en este slot
                            const hasReservation = reservations.some(res => {
                                const resEnd = new Date(res.date.getTime() + res.duration * 60000);
                                return slotDate >= res.date && slotDate < resEnd;
                            });
                            if (!hasReservation && slotDate > new Date()) {
                                availableSlots.push({
                                    date: slotDate,
                                    slot: slot.start
                                });
                            }
                        }
                    }
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return availableSlots;
    }
    /**
     * Actualizar disponibilidad de un profesional
     */
    async updateAvailability(professionalId, schedule, blockedDates) {
        const availability = await availability_models_1.default.findOneAndUpdate({ professionalId }, {
            schedule,
            ...(blockedDates && { blockedDates })
        }, { new: true, upsert: true });
        return availability;
    }
    /**
     * Confirmar una reserva
     */
    async confirmReservation(reservationId) {
        const reservation = await reservation_models_1.default.findByIdAndUpdate(reservationId, { status: reservation_models_1.ReservationStatus.CONFIRMED }, { new: true }).populate('professionalId userId');
        if (!reservation) {
            throw new Error('Reservation not found');
        }
        // Notificar al usuario
        await notification_service_1.default.createNotification({
            userId: reservation.userId.toString(),
            type: notification_models_1.NotificationType.RESERVATION_CONFIRMED,
            title: 'Reserva confirmada',
            message: `Tu reserva ha sido confirmada`,
            actionUrl: `/reservations/${reservation._id}`
        });
        await this.sendReservationEmail(reservation, 'confirmed');
        return reservation;
    }
    /**
     * Cancelar una reserva
     */
    async cancelReservation(reservationId, userId, reason) {
        const reservation = await reservation_models_1.default.findById(reservationId);
        if (!reservation) {
            throw new Error('Reservation not found');
        }
        if (reservation.userId.toString() !== userId) {
            throw new Error('Unauthorized');
        }
        if (reservation.status === reservation_models_1.ReservationStatus.CANCELLED) {
            throw new Error('Reservation already cancelled');
        }
        reservation.status = reservation_models_1.ReservationStatus.CANCELLED;
        reservation.cancellationReason = reason;
        await reservation.save();
        await reservation.populate('professionalId userId');
        await this.sendReservationEmail(reservation, 'cancelled');
        return reservation;
    }
    /**
     * Obtener reservas de un usuario
     */
    async getUserReservations(userId, status, page = 1, limit = 10) {
        const query = { userId };
        if (status)
            query.status = status;
        const skip = (page - 1) * limit;
        const total = await reservation_models_1.default.countDocuments(query);
        const reservations = await reservation_models_1.default.find(query)
            .populate('professionalId', 'name profession score')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);
        return {
            reservations,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        };
    }
    /**
     * Obtener reservas de un profesional
     */
    async getProfessionalReservations(professionalId, status, page = 1, limit = 10) {
        const query = { professionalId };
        if (status)
            query.status = status;
        const skip = (page - 1) * limit;
        const total = await reservation_models_1.default.countDocuments(query);
        const reservations = await reservation_models_1.default.find(query)
            .populate('userId', 'name email')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);
        return {
            reservations,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        };
    }
    /**
     * Enviar recordatorios de reserva
     */
    async sendReminders() {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
        // Recordatorios de 24 horas
        const reservations24h = await reservation_models_1.default.find({
            status: reservation_models_1.ReservationStatus.CONFIRMED,
            date: { $gte: in24Hours, $lte: new Date(in24Hours.getTime() + 60 * 60 * 1000) },
            reminderSent24h: false
        }).populate('userId professionalId');
        for (const reservation of reservations24h) {
            await notification_service_1.default.createNotification({
                userId: reservation.userId.toString(),
                type: notification_models_1.NotificationType.RESERVATION_REMINDER,
                title: 'Recordatorio de reserva',
                message: `Tu reserva es mañana a las ${reservation.date.toLocaleTimeString()}`,
                actionUrl: `/reservations/${reservation._id}`
            });
            await this.sendReservationEmail(reservation, 'reminder24h');
            reservation.reminderSent24h = true;
            await reservation.save();
        }
        // Recordatorios de 1 hora
        const reservations1h = await reservation_models_1.default.find({
            status: reservation_models_1.ReservationStatus.CONFIRMED,
            date: { $gte: in1Hour, $lte: new Date(in1Hour.getTime() + 15 * 60 * 1000) },
            reminderSent1h: false
        }).populate('userId professionalId');
        for (const reservation of reservations1h) {
            await notification_service_1.default.createNotification({
                userId: reservation.userId.toString(),
                type: notification_models_1.NotificationType.RESERVATION_REMINDER,
                title: 'Recordatorio de reserva',
                message: `Tu reserva es en 1 hora`,
                actionUrl: `/reservations/${reservation._id}`
            });
            await this.sendReservationEmail(reservation, 'reminder1h');
            reservation.reminderSent1h = true;
            await reservation.save();
        }
    }
    /**
     * Enviar email de reserva
     */
    async sendReservationEmail(reservation, type) {
        const user = reservation.userId;
        const professional = reservation.professionalId;
        let subject = '';
        let html = '';
        switch (type) {
            case 'created':
                subject = 'Reserva creada';
                html = `
          <h1>Reserva creada</h1>
          <p>Hola ${user.name},</p>
          <p>Tu reserva con ${professional.name} ha sido creada.</p>
          <p><strong>Fecha:</strong> ${reservation.date.toLocaleString()}</p>
          <p><strong>Duración:</strong> ${reservation.duration} minutos</p>
          <p><strong>Precio:</strong> $${reservation.price}</p>
        `;
                break;
            case 'confirmed':
                subject = 'Reserva confirmada';
                html = `
          <h1>Reserva confirmada</h1>
          <p>Hola ${user.name},</p>
          <p>Tu reserva ha sido confirmada.</p>
          <p><strong>Fecha:</strong> ${reservation.date.toLocaleString()}</p>
        `;
                break;
            case 'cancelled':
                subject = 'Reserva cancelada';
                html = `
          <h1>Reserva cancelada</h1>
          <p>Hola ${user.name},</p>
          <p>Tu reserva ha sido cancelada.</p>
          ${reservation.cancellationReason ? `<p><strong>Razón:</strong> ${reservation.cancellationReason}</p>` : ''}
        `;
                break;
            case 'reminder24h':
                subject = 'Recordatorio de reserva - Mañana';
                html = `
          <h1>Recordatorio de reserva</h1>
          <p>Hola ${user.name},</p>
          <p>Te recordamos que tienes una reserva mañana.</p>
          <p><strong>Fecha:</strong> ${reservation.date.toLocaleString()}</p>
          <p><strong>Con:</strong> ${professional.name}</p>
        `;
                break;
            case 'reminder1h':
                subject = 'Recordatorio de reserva - En 1 hora';
                html = `
          <h1>Recordatorio de reserva</h1>
          <p>Hola ${user.name},</p>
          <p>Tu reserva es en 1 hora.</p>
          <p><strong>Fecha:</strong> ${reservation.date.toLocaleString()}</p>
          <p><strong>Con:</strong> ${professional.name}</p>
        `;
                break;
        }
        try {
            await this.transporter.sendMail({
                from: email_config_1.emailConfig.auth.user,
                to: user.email,
                subject,
                html
            });
        }
        catch (error) {
            console.error('Error sending reservation email:', error);
        }
    }
}
exports.default = new ReservationService();
//# sourceMappingURL=reservation.service.js.map