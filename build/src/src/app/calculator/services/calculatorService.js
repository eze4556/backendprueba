"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatorService = void 0;
const productTypes_models_1 = __importDefault(require("../../productTypes/models/productTypes.models"));
const mongoose_1 = __importDefault(require("mongoose"));
class CalculatorService {
    async calculateTotal(productId, planType, paymentMethod) {
        try {
            // Obtener datos reales del producto desde la base de datos
            const product = await productTypes_models_1.default.findById(new mongoose_1.default.Types.ObjectId(productId));
            if (!product) {
                throw new Error('Producto no encontrado');
            }
            const productValue = product.product_info.price;
            let planPercentage = 0;
            // Determinar el porcentaje según el plan
            switch (planType) {
                case 'base':
                    planPercentage = CalculatorService.BASE_PLAN_PERCENTAGE;
                    break;
                case 'intermediate':
                    planPercentage = CalculatorService.INTERMEDIATE_PLAN_PERCENTAGE;
                    break;
                case 'gold':
                    planPercentage = CalculatorService.GOLD_PLAN_PERCENTAGE;
                    break;
                default:
                    throw new Error('Tipo de plan inválido');
            }
            // Cálculo del beneficio para la empresa
            const companyBenefit = productValue * planPercentage;
            // Cálculo del total con el porcentaje del plan
            const subtotal = productValue + companyBenefit;
            // Aplicar la comisión de la plataforma
            const platformFee = subtotal * CalculatorService.PLATFORM_FEE_PERCENTAGE;
            // Valor final después de la comisión
            const finalValue = subtotal - platformFee;
            return {
                productDetails: {
                    id: product._id,
                    name: product.product_info.name,
                    originalPrice: productValue
                },
                planDetails: {
                    type: planType,
                    percentage: planPercentage * 100
                },
                calculation: {
                    subtotal,
                    companyBenefit,
                    platformFee,
                    finalValue
                },
                paymentMethod
            };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.CalculatorService = CalculatorService;
CalculatorService.BASE_PLAN_PERCENTAGE = 0.05;
CalculatorService.INTERMEDIATE_PLAN_PERCENTAGE = 0.15;
CalculatorService.GOLD_PLAN_PERCENTAGE = 0.30;
CalculatorService.PLATFORM_FEE_PERCENTAGE = 0.05;
