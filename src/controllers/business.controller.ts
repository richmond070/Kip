import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import businessService from '../services/businessService';
import { getCurrentJwtKey } from '../utils/getJwtSecert';
import config from '../configs/config';
import { CreateBusinessSchema, UpdateBusinessSchema, LoginBusinessSchema } from '../dtos/businessDTO';

// Never send pinHash back in a response.
function toSafeBusiness(business: { phone: string; name: string; currency: string; createdAt: Date; updatedAt: Date }) {
    const { phone, name, currency, createdAt, updatedAt } = business;
    return { phone, name, currency, createdAt, updatedAt };
}

async function issueToken(phone: string) {
    const secret = await getCurrentJwtKey();
    return jwt.sign({ businessId: phone }, secret, { expiresIn: config.jwtExpiry });
}

export class BusinessController {
    // REGISTER — creates the business and logs it straight in (returns a
    // token), since there's no separate onboarding step for this app.
    async register(req: Request, res: Response) {
        const parse = CreateBusinessSchema.safeParse(req.body);
        if (!parse.success) {
            res.status(400).json({ error: parse.error.flatten() });
            return;
        }

        try {
            const business = await businessService.createBusiness(parse.data);
            const token = await issueToken(business.phone);
            res.status(201).json({ business: toSafeBusiness(business), token });
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }

    // LOGIN — phone + PIN.
    async login(req: Request, res: Response) {
        const parse = LoginBusinessSchema.safeParse(req.body);
        if (!parse.success) {
            res.status(400).json({ error: parse.error.flatten() });
            return;
        }

        try {
            const business = await businessService.loginWithPhoneAndPin(parse.data);
            const token = await issueToken(business.phone);
            res.status(200).json({ business: toSafeBusiness(business), token });
        } catch (error) {
            const err = error as Error;
            res.status(401).json({ error: err.message });
        }
    }

    // PROFILE — authenticated routes. req.user is set by the `authenticate`
    // middleware (decoded token payload: { businessId, iat, exp }).
    async getProfile(req: Request, res: Response) {
        try {
            const businessId = (req as any).user.businessId as string;
            const business = await businessService.getBusinessByPhone(businessId);
            res.status(200).json(toSafeBusiness(business));
        } catch (error) {
            const err = error as Error;
            res.status(404).json({ error: err.message });
        }
    }

    async updateProfile(req: Request, res: Response) {
        const parse = UpdateBusinessSchema.safeParse(req.body);
        if (!parse.success) {
            res.status(400).json({ error: parse.error.flatten() });
            return;
        }

        try {
            const businessId = (req as any).user.businessId as string;
            const business = await businessService.updateBusiness(businessId, parse.data);
            res.status(200).json(toSafeBusiness(business));
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }

    async deleteProfile(req: Request, res: Response) {
        try {
            const businessId = (req as any).user.businessId as string;
            await businessService.deleteBusiness(businessId);
            res.status(204).send();
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }
}