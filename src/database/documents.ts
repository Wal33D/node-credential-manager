import { MongoClient } from "mongodb";

interface SecretValue {
    value: any; // The actual value of the secret
  }
  
  interface Secret {
    _id: string;
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
  
export async function performDbOperation(operation: () => Promise<any>): Promise<any> {
    try {
        return await operation();
    } catch (error: any) {
        return { status: false, message: error.message };
    }
}

export async function databaseOperation(dbClient: MongoClient, dbName: string, action: (db: any) => Promise<any>): Promise<any> {
    return performDbOperation(async () => await action(dbClient.db(dbName)));
}

// Operations on Secrets
export const getAllSecretsFromCollection = (dbClient: MongoClient, dbName: string, collectionName: string): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const secrets = await db.collection(collectionName).find({}).toArray();
        return { status: true, message: "Successfully retrieved all secrets.", data: secrets };
    });

export const updateSecretsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object, update: object): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).updateMany(filter, update);
        return { status: true, message: `Updated ${result.modifiedCount} secrets in '${collectionName}'.`, data: result };
    });

export const deleteSecretsFromCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).deleteMany(filter);
        return { status: true, message: `Deleted ${result.deletedCount} secrets from '${collectionName}'.`, data: result };
    });

export const findSecretsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const secrets = await db.collection(collectionName).find(filter).toArray();
        return { status: true, message: `Found secrets in '${collectionName}'.`, data: secrets };
    });

export const countSecretsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const count = await db.collection(collectionName).countDocuments(filter);
        return { status: true, message: `Counted ${count} secrets in '${collectionName}'.`, data: [{ count }] };
    });

export const aggregateSecretsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, pipeline: object[]): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const secrets = await db.collection(collectionName).aggregate(pipeline).toArray();
        return { status: true, message: `Aggregated secrets in '${collectionName}'.`, data: secrets };
    });

export const findSecretByName = async ({ dbClient, dbName, collectionName, secretName }: { dbClient: MongoClient; dbName: string; collectionName: string; secretName: string; }): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const secret = await db.collection(collectionName).findOne({ SecretName: secretName });
        return { status: !!secret, message: secret ? `Secret with name '${secretName}' found successfully.` : `Secret with name '${secretName}' not found in '${collectionName}'.`, data: secret };
    });
