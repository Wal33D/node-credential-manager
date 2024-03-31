import { Db } from 'mongodb';
export interface InitializeMongoResponse {
    status: boolean;
    mongoDatabase: Db | null;
    message: string;
}
export interface CredentialKey {
    keyName: string;
    apiKey: string;
}

export interface ServiceCredential {
    name: string;
    keys: CredentialKey[];
}

export interface ViewCredentialsResult {
    status: boolean;
    message: string;
    credentialsMessage?: string; 
    databaseName?: string;
    collectionName?: string;
    servicesCount?: number;
    totalCredentials?: number;
    credentials?: ServiceCredential[];
}
