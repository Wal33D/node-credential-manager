import { MongoClient } from "mongodb";
import { OperationResponse } from "./types";

export const listCollections = async (dbClient: MongoClient, dbName: string): Promise<OperationResponse> => {
    try {
        const collections = await dbClient.db(dbName).listCollections().toArray();
        return { status: true, message: "Collections listed successfully.", dbName, collectionName: undefined, collections: collections.map(c => c.name) };
    } catch (error: any) {
        return { status: false, message: error.message, dbName };
    }
};

export const addNewCollection = async (dbClient: MongoClient, dbName: string, collectionName: string): Promise<OperationResponse> => {
    try {
        await dbClient.db(dbName).createCollection(collectionName);
        return { status: true, message: `Collection '${collectionName}' added.`, dbName, collectionName };
    } catch (error: any) {
        return { status: false, message: error.message, dbName, collectionName };
    }
};

export const renameCollection = async (dbClient: MongoClient, dbName: string, oldCollectionName: string, newCollectionName: string): Promise<OperationResponse> => {
    try {
        await dbClient.db(dbName).collection(oldCollectionName).rename(newCollectionName);
        return { status: true, message: `Collection renamed from '${oldCollectionName}' to '${newCollectionName}'.`, dbName, collectionName: newCollectionName };
    } catch (error: any) {
        return { status: false, message: error.message, dbName, collectionName: oldCollectionName };
    }
};

export const removeCollection = async (dbClient: MongoClient, dbName: string, collectionName: string): Promise<OperationResponse> => {
    try {
        await dbClient.db(dbName).dropCollection(collectionName);
        return { status: true, message: `Collection '${collectionName}' removed.`, dbName, collectionName };
    } catch (error: any) {
        return { status: false, message: error.message, dbName, collectionName };
    }
};

export const collectionExists = async (dbClient: MongoClient, dbName: string, collectionName: string): Promise<OperationResponse> => {
    try {
        const collections = await dbClient.db(dbName).listCollections({ name: collectionName }, { nameOnly: true }).toArray();
        const exists = collections.length > 0;
        return { status: true, message: exists ? `Collection '${collectionName}' exists.` : `Collection '${collectionName}' does not exist.`, dbName, collectionName, exists };
    } catch (error: any) {
        return { status: false, message: "An error occurred while checking if the collection exists.", dbName, collectionName, exists: false };
    }
};