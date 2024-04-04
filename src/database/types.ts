
import {  ObjectId } from "mongodb";

export interface OperationResponse {
    status: boolean;
    message: string;
    dbName?: string;
    collectionName?: string;
    exists?: boolean;
    filter?: object;
    collections?: string[];
    databases?: string[];
}
export interface dbDocumentOperationResponse {
    status: boolean;
    message: string;
    dbName: string;
    collectionName: string;
    databases?: string[];
    filter?: object;
}

export interface SecretValue {
    value: any;
}

export interface UpdateResult {
    matchedCount: number;
    modifiedCount: number;
    upsertedCount?: number;
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