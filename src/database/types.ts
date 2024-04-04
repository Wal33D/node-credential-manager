
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
    secretName: string;
    envName: string;
    envType: 'production' | 'test' | 'development';
    credential: [{ version: string, value: string }];
    updatedAt: Date;
    createdAt: Date;
    lastAccessAt: Date;
}

export interface Service {
    serviceName: string;
}
