import productRepository from '../repositories/product.repository';
import { CreateProductDTO, UpdateProductDTO } from '../dtos/productDTO';

export class ProductService {
    async createProduct(dto: CreateProductDTO) {
        return productRepository.create({
            business: { connect: { phone: dto.businessId } },
            name: dto.name,
            costPrice: dto.costPrice,
            sellingPrice: dto.sellingPrice,
            quantity: dto.quantity,
            unit: dto.unit,
        });
    }

    async getProductById(id: string) {
        const product = await productRepository.findById(id);
        if (!product) throw new Error('Product not found.');
        return product;
    }

    async getProductsByBusiness(businessId: string) {
        return productRepository.findManyByBusiness(businessId);
    }

    async updateProduct(id: string, updates: UpdateProductDTO) {
        const existing = await productRepository.findById(id);
        if (!existing) throw new Error('Product not found.');
        return productRepository.update(id, updates);
    }

    async deleteProduct(id: string) {
        const existing = await productRepository.findById(id);
        if (!existing) throw new Error('Product not found.');
        return productRepository.delete(id);
    }

    // Manual stock correction (e.g. stocktake adjustment) — distinct from
    // the automatic adjustments that happen inside orderService (sales) and
    // transactionService (purchases), which run atomically alongside a
    // ledger entry. This is a direct, un-ledgered correction.
    async adjustStock(id: string, delta: number) {
        const existing = await productRepository.findById(id);
        if (!existing) throw new Error('Product not found.');

        if (delta >= 0) {
            return productRepository.incrementStock(id, delta);
        }
        return productRepository.decrementStock(id, Math.abs(delta));
    }
}

export default new ProductService();
