import { Db, MongoClient } from "mongodb";

export interface OperationResult {
    status: boolean;
    message: string;
    client?: MongoClient;
    database?: Db;
    databases?: string[];
    collections?: string[];
    data?: any[];
}
export interface DbConnectionParams {
    dbUsername?: string;
    dbPassword?: string;
    dbCluster?: string;
}

export interface FindDocumentParams {
    dbClient: MongoClient;
    dbName: string;
    collectionName: string;
    documentName: string;
}
