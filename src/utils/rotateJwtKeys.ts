// utils/rotateJwtKey.ts
import crypto from "crypto";
import { JwtSecret } from "../models/JwtSecret.model";

// Generate a 256-bit secret
function generateSecret(): string {
    return crypto.randomBytes(32).toString("hex");
}

export async function rotateJwtKey() {
    const latest = await JwtSecret.findOne().sort({ version: -1 });
    const newVersion = latest ? latest.version + 1 : 1;

    const newSecret = new JwtSecret({
        key: generateSecret(),
        version: newVersion,
    });

    await newSecret.save();
    console.log(`🔐 JWT key rotated to version ${newVersion}`);
}
