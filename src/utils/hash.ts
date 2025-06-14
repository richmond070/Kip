import bcrypt from 'bcrypt';

export const hashPassword = async (plainText: string) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainText, salt);
};

export const comparePassword = async (plainText: string, hash: string) => {
    return bcrypt.compare(plainText, hash);
};
