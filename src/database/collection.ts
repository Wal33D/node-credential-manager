import { MongoClient } from "mongodb";
import { OperationResult } from "./types";
import { databaseOperation } from "./databaseOperation";

export const listCollections = async (dbClient: MongoClient, dbName: string): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const collections = await db.listCollections().toArray();
        return { status: true, message: "Collections listed successfully.", collections: collections.map((c: { name: any; }) => c.name) };
    });

export const addNewCollection = async ({ dbClient, dbName, collectionName }: { dbClient: MongoClient; dbName: string; collectionName: string; }): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.createCollection(collectionName);
        return { status: true, message: `Collection '${collectionName}' added.` };
    });

export const renameCollection = async ({ dbClient, dbName, oldCollectionName, newCollectionName, }: { dbClient: MongoClient; dbName: string; oldCollectionName: string; newCollectionName: string; }): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.collection(oldCollectionName).rename(newCollectionName);
        return { status: true, message: `Collection renamed from '${oldCollectionName}' to '${newCollectionName}'.` };
    });

export const removeCollection = async ({ dbClient, dbName, collectionName, }: { dbClient: MongoClient; dbName: string; collectionName: string; }): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.dropCollection(collectionName);
        return { status: true, message: `Collection '${collectionName}' removed.` };
    });
