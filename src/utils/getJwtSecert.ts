// utils/getJwtSecert.ts
import jwtSecretRepository from "../repositories/jwtSecret.repository";

let cachedKey: string;

export async function getCurrentJwtKey(): Promise<string> {
    if (cachedKey) return cachedKey;

    const latest = await jwtSecretRepository.findLatest();
    if (!latest) throw new Error("JWT secret not found.");
    cachedKey = latest.key;
    return cachedKey;
}
