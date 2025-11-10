import mongoose from 'mongoose';
import { Subscription, ISubscription } from '../models/subscription.model';

export class SubscriptionService {
    async getById(id: string): Promise<ISubscription> {
        const subscription = await Subscription.findById(id);
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        return subscription;
    }

    async create(data: Partial<ISubscription>): Promise<ISubscription> {
        const subscription = new Subscription(data);
        return await subscription.save();
    }

    async update(id: string, data: Partial<ISubscription>): Promise<ISubscription | null> {
        return await Subscription.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string): Promise<boolean> {
        const result = await Subscription.findByIdAndDelete(id);
        return result !== null;
    }

    async getAll(): Promise<ISubscription[]> {
        return await Subscription.find();
    }

    async getActiveSubscriptions(): Promise<ISubscription[]> {
        return await Subscription.find({
            status: 'active',
            endDate: { $gt: new Date() }
        });
    }

    async getByUserId(userId: string): Promise<ISubscription[]> {
        return await Subscription.find({ userId });
    }

    async cancelSubscription(id: string): Promise<ISubscription> {
        const subscription = await Subscription.findByIdAndUpdate(
            id,
            {
                status: 'cancelled',
                endDate: new Date()
            },
            { new: true }
        );

        if (!subscription) {
            throw new Error('Subscription not found');
        }

        return subscription;
    }
}