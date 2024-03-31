import { Db } from 'mongodb';
export interface InitializeMongoResponse {
    status: boolean;
    mongoDatabase: Db | null;
    message: string;
}
// Generic Operation Result
export interface OperationResult {
    status: boolean;
    message: string;
}

// Generic Operation Result with Credential
export interface OperationResultWithCredential<T> extends OperationResult {
    credential?: T;
}

// Defines a single credential key
export interface CredentialKey {
    keyName: string;
    apiKey: string;
}

// Represents a service with multiple credentials
export interface ServiceCredential {
    name: string;
    keys: CredentialKey[];
}

// Result of viewing credentials, extending the generic operation result
export interface ViewCredentialsResult extends OperationResult {
    credentialsMessage?: string; 
    databaseName?: string;
    collectionName?: string;
    servicesCount?: number;
    totalCredentials?: number;
    credentials?: ServiceCredential[];
}

export interface SpecificKeySearchResult extends OperationResultWithCredential<CredentialKey> {}

export interface ServiceCredentialOperationResult extends OperationResultWithCredential<ServiceCredential> {}

export interface InitializeMongoResponse {
    status: boolean;
    mongoDatabase: Db | null;
    message: string;
}