export interface AppMetadata {
    application: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    lastAccessed: Date;
}

export interface KeyData {
    encryptionKey?: string;
}

export interface EncryptionResult {
    iv: string;
    content: string;
}
