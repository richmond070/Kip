// models/JwtSecret.ts
import mongoose from "mongoose";

const jwtSecretSchema = new mongoose.Schema({
    key: { type: String, required: true },
    version: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const JwtSecret = mongoose.model("JwtSecret", jwtSecretSchema);
