// utils/getJwtSecret.ts
import { JwtSecret } from "../models/JwtSecret.model";

let cachedKey: string;

export async function getCurrentJwtKey(): Promise<string> {
    if (cachedKey) return cachedKey;

    const latest = await JwtSecret.findOne().sort({ version: -1 });
    if (!latest) throw new Error("JWT secret not found.");
    cachedKey = latest.key;
    return cachedKey;
}
