
import {  ObjectId } from "mongodb";

export interface dbProjectOperationResponse {
    status: boolean;
    message: string;
    projectName?: string;
    serviceName?: string;
    projects?: string[];
}
export interface dbSecretOperationResponse {
    status: boolean;
    message: string;
    projectName: string;
    serviceName: string;
    secretName?: string;
    filter?: object;
    secret?: Secret;
    version?: any;

}
export interface dbServiceOperationResponse {
    status: boolean;
    message: string;
    projectName: string;
    serviceName?: string;
    services?: string[];
    exists?: boolean;
} 

export interface SecretValue {
    value: any;
}

export interface UpdateResult {
    matchedCount?: number;
    modifiedCount?: number;
    upsertedCount?: number;
    newValue?: any;
}

export interface DeleteResult {
    deletedCount: number;
}

export interface Secret {
    _id: ObjectId;
    SecretName: string;
    envName: string;
    envType: 'production' | 'test' | 'development';
    values: {
        [version: string]: SecretValue;
    };
    updatedAt: Date;
    createdAt: Date;
    lastAccessAt: Date;
}

export interface Service {
    serviceName: string;
}
