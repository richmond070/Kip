// middleware/verifyToken.ts
import jwt from "jsonwebtoken";
import { JwtSecret } from "../models/JwtSecret.model";

export async function verifyToken(token: string) {
    const secrets = await JwtSecret.find().sort({ version: -1 }).limit(2); // current + previous

    for (const secret of secrets) {
        try {
            const payload = jwt.verify(token, secret.key);
            return payload;
        } catch {
            continue;
        }
    }

    throw new Error("Invalid or expired token.");
}
