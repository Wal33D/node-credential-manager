// Import necessary MongoDB types
import { MongoClient } from "mongodb";

// Assuming OperationResult and other interfaces are defined in a separate file, e.g., operationResult.ts
import { OperationResult } from "./operationResult";

// Utility function to perform database operations with error handling
async function performDbOperation(operation: () => Promise<OperationResult>): Promise<OperationResult> {
    try {
        return await operation();
    } catch (error: any) {
        return { status: false, message: error.message };
    }
}

// Database operation wrapper
export async function databaseOperation(dbClient: MongoClient, dbName: string, action: (db: any) => Promise<OperationResult>): Promise<OperationResult> {
    return performDbOperation(async () => await action(dbClient.db(dbName)));
}

// Utility functions for database operations
export const listAllDatabases = async (dbClient: MongoClient): Promise<OperationResult> =>
    performDbOperation(async () => {
        const dbs = await dbClient.db().admin().listDatabases();
        return { status: true, message: "Successfully retrieved database list.", databases: dbs.databases.map(db => db.name) };
    });

export const getDatabaseConnection = (dbClient: MongoClient, dbName: string): OperationResult => ({
    status: true, message: `Database '${dbName}' accessed successfully.`, database: dbClient.db(dbName),
});

// Example adapted function using databaseOperation
export const databaseExists = async (dbClient: MongoClient, dbName: string): Promise<OperationResult> =>
    databaseOperation(dbClient, "", async (client) => {
        const dbs = await client.db().admin().listDatabases();
        const exists = dbs.databases.some((db: { name: string; }) => db.name === dbName);
        return { status: true, message: exists ? `Database '${dbName}' exists.` : `Database '${dbName}' does not exist.` };
    });

// Consolidated function for creating a database by adding a collection
export const createDatabase = async (dbClient: MongoClient, dbName: string, collectionName: string): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.createCollection(collectionName);
        return { status: true, message: `Database '${dbName}' created successfully with collection '${collectionName}'.` };
    });

// Additional operations adapted similarly
export const listAllCollectionsInDatabase = (dbClient: MongoClient, dbName: string): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const collections = await db.listCollections().toArray();
        return { status: true, message: "Successfully retrieved collections list.", collections: collections.map((c: { name: any; }) => c.name) };
    });

export const getAllDocumentsFromCollection = (dbClient: MongoClient, dbName: string, collectionName: string): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const documents = await db.collection(collectionName).find({}).toArray();
        return { status: true, message: "Successfully retrieved all documents.", data: documents };
    });
// Update documents in a collection
export const updateDocumentsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object, update: object): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).updateMany(filter, update);
        return { status: true, message: `Updated ${result.modifiedCount} documents in '${collectionName}'.`, data: result };
    });

// Delete documents from a collection
export const deleteDocumentsFromCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).deleteMany(filter);
        return { status: true, message: `Deleted ${result.deletedCount} documents from '${collectionName}'.`, data: result };
    });

// Find documents in a collection with optional filter
export const findDocumentsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const documents = await db.collection(collectionName).find(filter).toArray();
        return { status: true, message: `Found documents in '${collectionName}'.`, data: documents };
    });

// Count documents in a collection with optional filter
export const countDocumentsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const count = await db.collection(collectionName).countDocuments(filter);
        return { status: true, message: `Counted ${count} documents in '${collectionName}'.`, data: [{ count }] };
    });

// Aggregate documents in a collection
export const aggregateDocumentsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, pipeline: object[]): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const documents = await db.collection(collectionName).aggregate(pipeline).toArray();
        return { status: true, message: `Aggregated documents in '${collectionName}'.`, data: documents };
    });
