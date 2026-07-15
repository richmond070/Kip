import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    jwtExpiry: number;
}

const NODE_ENV = process.env.NODE_ENV || ' ';
const server_port = process.env.PORT ? Number(process.env.PORT) : 3000;
const jwtExpiry = process.env.JWT_EXPIRY ? Number(process.env.JWT_EXPIRY) : 86400;

const config: Config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtExpiry: jwtExpiry
};

//CHECK FOR ENVIRONMENT
if (NODE_ENV === 'production') {
    config.port = server_port;
} else if (NODE_ENV === 'local') {
    config.port = server_port;
}

export default config;