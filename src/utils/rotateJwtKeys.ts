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

    console.log(` JWT key rotated to version ${newVersion}`);
}

// Bootstrap — a fresh database has no keys at all, and scheduleKeyRotation()
// only fires on its cron schedule (every 2 days), never immediately. Without
// this, getCurrentJwtKey()/verifyToken() have nothing to sign or verify
// against until the first scheduled rotation actually runs.
export async function ensureJwtSecretExists() {
    const existing = await jwtSecretRepository.findLatest();
    if (!existing) {
        console.log("No JWT secret found — creating the first one.");
        await rotateJwtKey();
    }
}