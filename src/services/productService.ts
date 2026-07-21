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

    // businessId is required on every read/write below so one business can
    // never fetch, edit, or delete another business's product just by
    // guessing/enumerating an id. Not found and "not yours" both return the
    // same "Product not found" error — existence of another business's
    // product id shouldn't be leakable either.
    async getProductById(id: string, businessId: string) {
        const product = await productRepository.findById(id);
        if (!product || product.businessId !== businessId) {
            throw new Error('Product not found.');
        }
        return product;
    }

    async getProductsByBusiness(businessId: string) {
        return productRepository.findManyByBusiness(businessId);
    }

    async updateProduct(id: string, businessId: string, updates: UpdateProductDTO) {
        const existing = await productRepository.findById(id);
        if (!existing || existing.businessId !== businessId) {
            throw new Error('Product not found.');
        }
        return productRepository.update(id, updates);
    }

    async deleteProduct(id: string, businessId: string) {
        const existing = await productRepository.findById(id);
        if (!existing || existing.businessId !== businessId) {
            throw new Error('Product not found.');
        }
        return productRepository.delete(id);
    }

    // Manual stock correction (e.g. stocktake adjustment) — distinct from
    // the automatic adjustments that happen inside orderService (sales) and
    // transactionService (purchases), which run atomically alongside a
    // ledger entry. This is a direct, un-ledgered correction.
    async adjustStock(id: string, businessId: string, delta: number) {
        const existing = await productRepository.findById(id);
        if (!existing || existing.businessId !== businessId) {
            throw new Error('Product not found.');
        }

        if (delta >= 0) {
            return productRepository.incrementStock(id, delta);
        }
        return productRepository.decrementStock(id, Math.abs(delta));
    }
}

export default new ProductService();