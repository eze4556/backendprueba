import Reservation, { ReservationStatus } from '../models/reservation.models';
import Availability from '../models/availability.models';
import Professional from '../models/professional.models';
import notificationService from '../../users/services/notification.service';
import { NotificationType } from '../../users/models/notification.models';
import nodemailer from 'nodemailer';
import { emailConfig } from '../../../config/email.config';

class ReservationService {
  
  private transporter: nodemailer.Transporter;
  
  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig);
  }
  
  /**
   * Crear una nueva reserva
   */
  public async createReservation(
    userId: string,
    professionalId: string,
    serviceType: string,
    date: Date,
    duration: number,
    price: number,
    notes?: string
  ): Promise<any> {
    // Verificar que el profesional existe
    const professional = await Professional.findById(professionalId);
    if (!professional) {
      throw new Error('Professional not found');
    }
    
    // Verificar disponibilidad
    const isAvailable = await this.checkAvailability(professionalId, date, duration);
    if (!isAvailable) {
      throw new Error('Selected time slot is not available');
    }
    
    // Crear la reserva
    const reservation = await Reservation.create({
      userId,
      professionalId,
      serviceType,
      date,
      duration,
      price,
      notes,
      status: ReservationStatus.PENDING
    });
    
    // Poblar datos
    await reservation.populate('professionalId', 'name profession');
    await reservation.populate('userId', 'name email');
    
    // Enviar notificación al usuario
    await notificationService.createNotification({
      userId,
      type: NotificationType.RESERVATION_CONFIRMED,
      title: 'Reserva creada',
      message: `Tu reserva con ${(professional as any).name} ha sido creada`,
      actionUrl: `/reservations/${reservation._id}`
    });
    
    // Enviar email de confirmación
    await this.sendReservationEmail(reservation, 'created');
    
    return reservation;
  }
  
  /**
   * Verificar disponibilidad para una fecha y duración
   */
  public async checkAvailability(
    professionalId: string,
    date: Date,
    duration: number
  ): Promise<boolean> {
    const endTime = new Date(date.getTime() + duration * 60000);
    
    // Buscar reservas existentes que se solapen
    const overlappingReservations = await Reservation.find({
      professionalId,
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
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
  public async getAvailability(
    professionalId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const availability = await Availability.findOne({ professionalId });
    
    if (!availability) {
      throw new Error('Availability not configured for this professional');
    }
    
    // Obtener todas las reservas en el rango
    const reservations = await Reservation.find({
      professionalId,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] }
    });
    
    const availableSlots: any[] = [];
    
    // Generar slots disponibles día por día
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const daySchedule = availability.schedule.find(s => s.dayOfWeek === dayOfWeek);
      
      if (daySchedule && daySchedule.isWorking) {
        // Verificar si el día no está bloqueado
        const isBlocked = availability.blockedDates.some(
          blocked => blocked.toDateString() === currentDate.toDateString()
        );
        
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
  public async updateAvailability(
    professionalId: string,
    schedule: any[],
    blockedDates?: Date[]
  ): Promise<any> {
    const availability = await Availability.findOneAndUpdate(
      { professionalId },
      { 
        schedule,
        ...(blockedDates && { blockedDates })
      },
      { new: true, upsert: true }
    );
    
    return availability;
  }
  
  /**
   * Confirmar una reserva
   */
  public async confirmReservation(reservationId: string): Promise<any> {
    const reservation = await Reservation.findByIdAndUpdate(
      reservationId,
      { status: ReservationStatus.CONFIRMED },
      { new: true }
    ).populate('professionalId userId');
    
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    
    // Notificar al usuario
    await notificationService.createNotification({
      userId: reservation.userId.toString(),
      type: NotificationType.RESERVATION_CONFIRMED,
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
  public async cancelReservation(
    reservationId: string,
    userId: string,
    reason?: string
  ): Promise<any> {
    const reservation = await Reservation.findById(reservationId);
    
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    
    if (reservation.userId.toString() !== userId) {
      throw new Error('Unauthorized');
    }
    
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new Error('Reservation already cancelled');
    }
    
    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancellationReason = reason;
    await reservation.save();
    
    await reservation.populate('professionalId userId');
    
    await this.sendReservationEmail(reservation, 'cancelled');
    
    return reservation;
  }
  
  /**
   * Obtener reservas de un usuario
   */
  public async getUserReservations(
    userId: string,
    status?: ReservationStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    const query: any = { userId };
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const total = await Reservation.countDocuments(query);
    const reservations = await Reservation.find(query)
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
  public async getProfessionalReservations(
    professionalId: string,
    status?: ReservationStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    const query: any = { professionalId };
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const total = await Reservation.countDocuments(query);
    const reservations = await Reservation.find(query)
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
  public async sendReminders(): Promise<void> {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Recordatorios de 24 horas
    const reservations24h = await Reservation.find({
      status: ReservationStatus.CONFIRMED,
      date: { $gte: in24Hours, $lte: new Date(in24Hours.getTime() + 60 * 60 * 1000) },
      reminderSent24h: false
    }).populate('userId professionalId');
    
    for (const reservation of reservations24h) {
      await notificationService.createNotification({
        userId: reservation.userId.toString(),
        type: NotificationType.RESERVATION_REMINDER,
        title: 'Recordatorio de reserva',
        message: `Tu reserva es mañana a las ${reservation.date.toLocaleTimeString()}`,
        actionUrl: `/reservations/${reservation._id}`
      });
      
      await this.sendReservationEmail(reservation, 'reminder24h');
      
      reservation.reminderSent24h = true;
      await reservation.save();
    }
    
    // Recordatorios de 1 hora
    const reservations1h = await Reservation.find({
      status: ReservationStatus.CONFIRMED,
      date: { $gte: in1Hour, $lte: new Date(in1Hour.getTime() + 15 * 60 * 1000) },
      reminderSent1h: false
    }).populate('userId professionalId');
    
    for (const reservation of reservations1h) {
      await notificationService.createNotification({
        userId: reservation.userId.toString(),
        type: NotificationType.RESERVATION_REMINDER,
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
  private async sendReservationEmail(reservation: any, type: string): Promise<void> {
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
        from: emailConfig.auth.user,
        to: user.email,
        subject,
        html
      });
    } catch (error) {
      console.error('Error sending reservation email:', error);
    }
  }
}

export default new ReservationService();
