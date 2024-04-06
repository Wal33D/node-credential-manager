import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EncryptionResult, KeyData } from '../types';

const keyFilePath: string = path.join(__dirname, 'credentialManagerKey.json');
const algorithm: string = 'aes-256-ctr';

const generateEncryptionKey = (): string => crypto.randomBytes(32).toString('hex');

export const checkAndGenerateEncryptionKey = (): void => {
    let keyData: KeyData = {};

    if (fs.existsSync(keyFilePath)) {
        const data: string = fs.readFileSync(keyFilePath, 'utf8');
        keyData = JSON.parse(data);
    }

    if (!keyData.encryptionKey) {
        keyData.encryptionKey = generateEncryptionKey();
        fs.writeFileSync(keyFilePath, JSON.stringify(keyData, null, 2));
        console.log('Generated a new encryption key and saved it.');
    } else {
        console.log('Encryption key already exists.');
    }
};

const getEncryptionKey = (): string => {
    if (!fs.existsSync(keyFilePath)) {
        throw new Error('Encryption key file does not exist. Run checkAndGenerateEncryptionKey first.');
    }

    const data: string = fs.readFileSync(keyFilePath, 'utf8');
    const keyData: KeyData = JSON.parse(data);

    if (!keyData.encryptionKey) {
        throw new Error('Encryption key is not set in the file.');
    }

    return keyData.encryptionKey;
};

export const encrypt = ({ value }: { value: string }): EncryptionResult => {
    const iv = crypto.randomBytes(16);
    const secretKey = getEncryptionKey();

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex'),
    };
};

export const decrypt = ({ hash }: { hash: EncryptionResult }): string => {
    const secretKey = getEncryptionKey();

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    return decrypted.toString();
};
