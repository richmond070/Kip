import { Request, Response } from 'express';
import productService from '../services/productService';
import { CreateProductSchema, UpdateProductSchema } from '../dtos/productDTO';
import { z } from 'zod';

const AdjustStockSchema = z.object({
    delta: z.number().refine((n) => n !== 0, 'delta must be non-zero'),
});

export class ProductController {
    async createProduct(req: Request, res: Response) {
        const businessId = (req as any).user.businessId as string;
        // businessId always comes from the token, never the request body —
        // overriding whatever (if anything) the client sent for it.
        const parse = CreateProductSchema.safeParse({ ...req.body, businessId });
        if (!parse.success) {
            res.status(400).json({ error: parse.error.flatten() });
            return;
        }

        try {
            const product = await productService.createProduct(parse.data);
            res.status(201).json(product);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }

    async getProduct(req: Request, res: Response) {
        try {
            const businessId = (req as any).user.businessId as string;
            const product = await productService.getProductById(req.params.id, businessId);
            res.status(200).json(product);
        } catch (error) {
            const err = error as Error;
            res.status(404).json({ error: err.message });
        }
    }

    async listProducts(req: Request, res: Response) {
        const businessId = (req as any).user.businessId as string;
        const products = await productService.getProductsByBusiness(businessId);
        res.status(200).json(products);
    }

    async updateProduct(req: Request, res: Response) {
        const parse = UpdateProductSchema.safeParse(req.body);
        if (!parse.success) {
            res.status(400).json({ error: parse.error.flatten() });
            return;
        }

        try {
            const businessId = (req as any).user.businessId as string;
            const product = await productService.updateProduct(req.params.id, businessId, parse.data);
            res.status(200).json(product);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }

    async deleteProduct(req: Request, res: Response) {
        try {
            const businessId = (req as any).user.businessId as string;
            await productService.deleteProduct(req.params.id, businessId);
            res.status(204).send();
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }

    // Manual stocktake correction — separate from the automatic stock
    // changes inside order/transaction flows. { delta: 5 } adds 5 units,
    // { delta: -5 } removes 5.
    async adjustStock(req: Request, res: Response) {
        const parse = AdjustStockSchema.safeParse(req.body);
        if (!parse.success) {
            res.status(400).json({ error: parse.error.flatten() });
            return;
        }

        try {
            const businessId = (req as any).user.businessId as string;
            const product = await productService.adjustStock(req.params.id, businessId, parse.data.delta);
            res.status(200).json(product);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }
}