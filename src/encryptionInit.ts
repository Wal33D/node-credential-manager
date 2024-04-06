import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const envFilePath = path.resolve(__dirname, '.env');
const encryptionKeyEnvVar = 'CREDENTIAL_MANAGER_ENCRYPTION_KEY';
const algorithm = 'aes-256-ctr';

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

function checkAndGenerateEncryptionKey() {
  let envVars = '';

  if (fs.existsSync(envFilePath)) {
    envVars = fs.readFileSync(envFilePath, 'utf-8');
  }

  const keyRegExp = new RegExp(`^${encryptionKeyEnvVar}=`, 'm');
  if (!keyRegExp.test(envVars)) {
    const newKey = generateEncryptionKey();
    const envVarString = `${encryptionKeyEnvVar}=${newKey}\n`;
    fs.appendFileSync(envFilePath, envVarString);
    console.log('Generated a new encryption key and saved it to the .env file.');
    console.log('IMPORTANT: Make sure to set this environment variable in your production environment securely.');
  } else {
    console.log('Encryption key already exists in .env file.');
  }
}

const encrypt = (text:any) => {
    const iv = crypto.randomBytes(16);
    const secretKey = process.env.CREDENTIAL_MANAGER_ENCRYPTION_KEY;
    if (!secretKey) {
      throw new Error('The encryption key is not available.');
    }

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};

const decrypt = (hash:any) => {
    const secretKey = process.env.CREDENTIAL_MANAGER_ENCRYPTION_KEY; 
    if (!secretKey) {
      throw new Error('The encryption key is not available.');
    }

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    return decrypted.toString();
};


export { encrypt, decrypt, checkAndGenerateEncryptionKey };
