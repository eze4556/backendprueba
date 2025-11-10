"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const subscription_model_1 = require("../models/subscription.model");
class SubscriptionService {
    async getById(id) {
        const subscription = await subscription_model_1.Subscription.findById(id);
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        return subscription;
    }
    async create(data) {
        const subscription = new subscription_model_1.Subscription(data);
        return await subscription.save();
    }
    async update(id, data) {
        return await subscription_model_1.Subscription.findByIdAndUpdate(id, data, { new: true });
    }
    async delete(id) {
        const result = await subscription_model_1.Subscription.findByIdAndDelete(id);
        return result !== null;
    }
    async getAll() {
        return await subscription_model_1.Subscription.find();
    }
    async getActiveSubscriptions() {
        return await subscription_model_1.Subscription.find({
            status: 'active',
            endDate: { $gt: new Date() }
        });
    }
    async getByUserId(userId) {
        return await subscription_model_1.Subscription.find({ userId });
    }
    async cancelSubscription(id) {
        const subscription = await subscription_model_1.Subscription.findByIdAndUpdate(id, {
            status: 'cancelled',
            endDate: new Date()
        }, { new: true });
        if (!subscription) {
            throw new Error('Subscription not found');
        }
        return subscription;
    }
}
exports.SubscriptionService = SubscriptionService;
//# sourceMappingURL=subscription.service.js.map