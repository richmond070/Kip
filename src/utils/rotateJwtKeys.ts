// utils/rotateJwtKeys.ts
import crypto from "crypto";
import jwtSecretRepository from "../repositories/jwtSecret.repository";

// Generate a 256-bit secret
function generateSecret(): string {
    return crypto.randomBytes(32).toString("hex");
}

export async function rotateJwtKey() {
    const latest = await jwtSecretRepository.findLatest();
    const newVersion = latest ? latest.version + 1 : 1;

    await jwtSecretRepository.create({
        key: generateSecret(),
        version: newVersion,
    });

    console.log(`🔐 JWT key rotated to version ${newVersion}`);
}
