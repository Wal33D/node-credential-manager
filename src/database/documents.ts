import { MongoClient, ObjectId, Db } from "mongodb";

interface OperationResponse<T> {
    status: boolean;
    message: string;
    data?: T;
}

interface SecretValue {
    value: any;
}

interface Secret {
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

export async function performDatabaseOperation(dbClient: MongoClient, dbName: string, action: (db: Db) => Promise<any>): Promise<any> {
    try {
        const db = dbClient.db(dbName);
        return await action(db);
    } catch (error: any) {
        return { status: false, message: error.message };
    }
}

export const getAllSecretsFromCollection = async (dbClient: MongoClient, dbName: string, collectionName: string): Promise<OperationResponse<Secret[]>> => {
    return performDatabaseOperation(dbClient, dbName, async (db) => {
        const secrets = await db.collection(collectionName).find({}).toArray() as Secret[];
        return { status: true, message: "Successfully retrieved all secrets.", data: secrets };
    });
};

export const updateSecretsInCollection = async (dbClient: MongoClient, dbName: string, collectionName: string, filter: object, update: object): Promise<OperationResponse<any>> => {
    return performDatabaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).updateMany(filter, update);
        return { status: true, message: `Updated ${result.modifiedCount} secrets in '${collectionName}'.`, data: result };
    });
};

export const updateSecretInCollection = async ( dbClient: MongoClient, dbName: string, collectionName: string, filter: object, update: object ): Promise<OperationResponse<any>> => {
    return performDatabaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).updateOne(filter, update);
        return { 
            status: result.modifiedCount === 1,
            message: result.modifiedCount === 1 ? `Updated a secret in '${collectionName}'.` : `No secrets matched the filter, or no changes were needed.`,
            data: result 
        };
    });
};

export const deleteSecretsFromCollection = async (dbClient: MongoClient, dbName: string, collectionName: string, filter: object): Promise<OperationResponse<any>> => {
    return performDatabaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).deleteMany(filter);
        return { status: true, message: `Deleted ${result.deletedCount} secrets from '${collectionName}'.`, data: result };
    });
};

export const deleteSecretFromCollection = async ( dbClient: MongoClient, dbName: string, collectionName: string, filter: object ): Promise<OperationResponse<any>> => {
    return performDatabaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).deleteOne(filter);
        return { 
            status: result.deletedCount === 1,
            message: result.deletedCount === 1 ? `Deleted a secret from '${collectionName}'.` : `No secrets matched the filter to delete.`,
            data: result 
        };
    });
};

export const countSecretsInCollection = async (dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}): Promise<OperationResponse<{ count: number }[]>> => {
    return performDatabaseOperation(dbClient, dbName, async (db) => {
        const count = await db.collection(collectionName).countDocuments(filter);
        return { status: true, message: `Counted ${count} secrets in '${collectionName}'.`, data: [{ count }] };
    });
};

export const findSecretsInCollection = async (dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}): Promise<OperationResponse<Secret[]>> => {
    return performDatabaseOperation(dbClient, dbName, async (db) => {
        const secrets = await db.collection(collectionName).find(filter).toArray() as Secret[];
        return { status: true, message: `Found secrets in '${collectionName}'.`, data: secrets };
    });
};

export const aggregateSecretsInCollection = async (dbClient: MongoClient, dbName: string, collectionName: string, pipeline: object[]): Promise<OperationResponse<Secret[]>> => {
    return performDatabaseOperation(dbClient, dbName, async (db) => {
        const secrets = await db.collection(collectionName).aggregate(pipeline).toArray() as Secret[];
        return { status: true, message: `Aggregated secrets in '${collectionName}'.`, data: secrets };
    });
};

export const findSecretByName = async ({ dbClient, dbName, collectionName, secretName }: { dbClient: MongoClient; dbName: string; collectionName: string; secretName: string; }): Promise<OperationResponse<Secret>> => {
    return performDatabaseOperation(dbClient, dbName, async (db) => {
        const secret = await db.collection(collectionName).findOne({ SecretName: secretName }) as Secret | null;
        return { status: !!secret, message: secret ? `Secret with name '${secretName}' found successfully.` : `Secret with name '${secretName}' not found in '${collectionName}'.`, data: secret };
    });
};
