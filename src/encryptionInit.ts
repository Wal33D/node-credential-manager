import fs from 'fs/promises'; // Use the promise-based version of the fs module
import path from 'path';
import crypto from 'crypto';
import { EncryptionResult, KeyData } from './types';

const keyFilePath: string = path.join(__dirname, 'credentialManagerKey.json');
const algorithm: string = 'aes-256-ctr';

const generateEncryptionKey = (): string => crypto.randomBytes(32).toString('hex');

export const checkAndGenerateEncryptionKey = async (): Promise<void> => {
    try {
        let keyData: KeyData = {};
        let data: string;

        try {
            data = await fs.readFile(keyFilePath, 'utf8');
            keyData = JSON.parse(data);
        } catch (error:any) {
            if (error.code !== 'ENOENT') throw error; 
        }

        if (!keyData.encryptionKey) {
            keyData.encryptionKey = generateEncryptionKey();
            await fs.writeFile(keyFilePath, JSON.stringify(keyData, null, 2));
            console.info('Generated a new encryption key and saved it.');
        } else {
            console.info('Encryption key already exists.');
        }
    } catch (error) {
        console.error('Failed to check or generate encryption key:', error);
        throw new Error('Failed to initialize encryption key.');
    }
};

const getEncryptionKey = async (): Promise<string> => {
    try {
        const data = await fs.readFile(keyFilePath, 'utf8');
        const keyData: KeyData = JSON.parse(data);

        if (!keyData.encryptionKey) {
            throw new Error('Encryption key is not set in the file.');
        }

        return keyData.encryptionKey;
    } catch (error) {
        console.error('Error retrieving the encryption key:', error);
        throw new Error('Failed to retrieve the encryption key. Make sure the key has been initialized.');
    }
};

export const encrypt = async ({ value }: { value: string }): Promise<EncryptionResult> => {
    const iv = crypto.randomBytes(16);
    const secretKey = await getEncryptionKey();

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex'),
    };
};

export const decrypt = async ({ hash }: { hash: EncryptionResult }): Promise<string> => {
    const secretKey = await getEncryptionKey();

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    return decrypted.toString();
};
