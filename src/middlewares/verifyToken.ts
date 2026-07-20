// middleware/verifyToken.ts
import jwt from "jsonwebtoken";
import jwtSecretRepository from "../repositories/jwtSecret.repository";

export async function verifyToken(token: string) {
    const secrets = await jwtSecretRepository.findLatestTwo(); // current + previous

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
