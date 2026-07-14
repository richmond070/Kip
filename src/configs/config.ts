import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    mongoUser: string;
    mongoPassword: string;
    mongoDBUri: string;
    jwtExpiry: number;
}

const mongoDBUri = process.env.MONGODB_URI as string;
const mongoDBUser = process.env.MONGODB_USER as string;
const mongoDBPassword = process.env.MONGODB_PASSWORD as string;
const NODE_ENV = process.env.NODE_ENV || ' ';
const server_port = process.env.PORT ? Number(process.env.PORT) : 3000;
const jwtExpiry = process.env.JWT_EXPIRY ? Number(process.env.JWT_EXPIRY) : 86400;

const config: Config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoDBUri: mongoDBUri,
    mongoUser: mongoDBUser,
    mongoPassword: mongoDBPassword,
    jwtExpiry: jwtExpiry
};

//CHECK FOR ENVIRONMENT
if (NODE_ENV === 'production') {
    config.mongoDBUri = mongoDBUri;
    config.port = server_port;
} else if (NODE_ENV === 'local') {
    config.mongoDBUri = mongoDBUri;
    config.port = server_port;
}

export default config;