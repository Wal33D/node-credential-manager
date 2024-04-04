import { MongoClient, ObjectId } from "mongodb";

interface OperationResponse {
    status: boolean;
    message: string;
    dbName: string;
    collectionName: string;
    filter?: object;
}

interface SecretValue {
    value: any;
}

interface UpdateResult {
    matchedCount: number;
    modifiedCount: number;
    upsertedCount?: number;
}

interface DeleteResult {
    deletedCount: number;
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


// Update secrets in a collection
export const updateSecretsInCollection = async (
    dbClient: MongoClient, dbName: string, collectionName: string, filter: object, update: object
): Promise<OperationResponse & UpdateResult> => {
    const result: UpdateResult = await dbClient.db(dbName).collection(collectionName).updateMany(filter, update);
    return {
        status: true, message: `Updated ${result.modifiedCount} secrets in '${collectionName}'.`, dbName, collectionName, filter, ...result
    };
};

// Update an individual secret in a collection
export const updateSecretInCollection = async (
    dbClient: MongoClient, dbName: string, collectionName: string, filter: object, update: object
): Promise<OperationResponse & UpdateResult> => {
    const result: UpdateResult = await dbClient.db(dbName).collection(collectionName).updateOne(filter, update);
    return {
        status: result.modifiedCount === 1, message: result.modifiedCount === 1 ? `Updated a secret in '${collectionName}'.` : `No secrets matched the filter, or no changes were needed.`, dbName, collectionName, filter, ...result
    };
};

// Delete secrets from a collection
export const deleteSecretsFromCollection = async (
    dbClient: MongoClient, dbName: string, collectionName: string, filter: object
): Promise<OperationResponse & DeleteResult> => {
    const result: DeleteResult = await dbClient.db(dbName).collection(collectionName).deleteMany(filter);
    return {
        status: true, message: `Deleted ${result.deletedCount} secrets from '${collectionName}'.`, dbName, collectionName, filter, ...result
    };
};

// Delete an individual secret from a collection
export const deleteSecretFromCollection = async (
    dbClient: MongoClient, dbName: string, collectionName: string, filter: object
): Promise<OperationResponse & DeleteResult> => {
    const result: DeleteResult = await dbClient.db(dbName).collection(collectionName).deleteOne(filter);
    return {
        status: result.deletedCount === 1, message: result.deletedCount === 1 ? `Deleted a secret from '${collectionName}'.` : `No secrets matched the filter to delete.`, dbName, collectionName, filter, ...result
    };
};

// Count secrets in a collection
export const countSecretsInCollection = async (
    dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}
): Promise<OperationResponse & { count: number }> => {
    const count = await dbClient.db(dbName).collection(collectionName).countDocuments(filter);
    return {
        status: true, message: `Counted ${count} secrets in '${collectionName}'.`, dbName, collectionName, filter, count
    };
};

// Get all secrets from a collection
export const getAllSecretsFromCollection = async (
    dbClient: MongoClient, dbName: string, collectionName: string
): Promise<OperationResponse & { secrets: Secret[] }> => {
    const secrets = await dbClient.db(dbName).collection(collectionName).find({}).toArray() as Secret[];
    return {
        status: true, message: "Successfully retrieved all secrets.", dbName, collectionName, secrets
    };
};

// Find secrets in a collection
export const findSecretsInCollection = async (
    dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}
): Promise<OperationResponse & { secrets: Secret[] }> => {
    const secrets: Secret[] = await dbClient.db(dbName).collection(collectionName).find(filter).toArray() as Secret[];
    return {
        status: true, message: `Found secrets in '${collectionName}'.`, dbName, collectionName, filter, secrets
    };
};

// Aggregate secrets in a collection
export const aggregateSecretsInCollection = async (
    dbClient: MongoClient, dbName: string, collectionName: string, pipeline: object[]
): Promise<OperationResponse & { secrets: Secret[] }> => {
    const secrets: Secret[] = await dbClient.db(dbName).collection(collectionName).aggregate(pipeline).toArray() as Secret[];;
    return {
        status: true, message: `Aggregated secrets in '${collectionName}'.`, dbName, collectionName, secrets
    };
};

// Find a secret by name
export const findSecretByName = async (
    { dbClient, dbName, collectionName, secretName }: { dbClient: MongoClient; dbName: string; collectionName: string; secretName: string; }
): Promise<OperationResponse & { secret?: Secret }> => {
    const secret: Secret | null = await dbClient.db(dbName).collection(collectionName).findOne({ SecretName: secretName }) as Secret;
    return {
        status: !!secret, message: secret ? `Secret with name '${secretName}' found successfully.` : `Secret with name '${secretName}' not found in '${collectionName}'.`, dbName, collectionName, secret
    };
};