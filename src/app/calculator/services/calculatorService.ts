import ProductModel from '../../productTypes/models/productTypes.models';
import mongoose from 'mongoose';

export class CalculatorService {
    private static readonly BASE_PLAN_PERCENTAGE = 0.05;
    private static readonly INTERMEDIATE_PLAN_PERCENTAGE = 0.15;
    private static readonly GOLD_PLAN_PERCENTAGE = 0.30;
    private static readonly PLATFORM_FEE_PERCENTAGE = 0.05;

    public async calculateTotal(productId: string, planType: string, paymentMethod: string): Promise<any> {
        try {
            // Obtener datos reales del producto desde la base de datos
            const product = await ProductModel.findById(new mongoose.Types.ObjectId(productId));
            
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
        } catch (error) {
            throw error;
        }
    }
}