import { MongoClient } from "mongodb";
import { dbSecretOperationResponse, Secret, SecretValue, UpdateResult, DeleteResult } from "./types";

// Update secrets in a collection
export const updateSecretsInCollection = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object, update: object
): Promise<dbSecretOperationResponse & UpdateResult> => {
    const result: UpdateResult = await dbClient.db(projectName).collection(serviceName).updateMany(filter, update);
    return {
        status: true, message: `Updated ${result.modifiedCount} secrets in '${serviceName}'.`, projectName, serviceName, filter, ...result
    };
};

// Update an individual secret in a collection
export const updateSecretInCollection = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object, update: object
): Promise<dbSecretOperationResponse & UpdateResult> => {
    const result: UpdateResult = await dbClient.db(projectName).collection(serviceName).updateOne(filter, update);
    return {
        status: result.modifiedCount === 1, message: result.modifiedCount === 1 ? `Updated a secret in '${serviceName}'.` : `No secrets matched the filter, or no changes were needed.`, projectName, serviceName, filter, ...result
    };
};

// Delete secrets from a collection
export const deleteSecretsFromCollection = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object
): Promise<dbSecretOperationResponse & DeleteResult> => {
    const result: DeleteResult = await dbClient.db(projectName).collection(serviceName).deleteMany(filter);
    return {
        status: true, message: `Deleted ${result.deletedCount} secrets from '${serviceName}'.`, projectName, serviceName, filter, ...result
    };
};

// Delete an individual secret from a collection
export const deleteSecretFromCollection = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object
): Promise<dbSecretOperationResponse & DeleteResult> => {
    const result: DeleteResult = await dbClient.db(projectName).collection(serviceName).deleteOne(filter);
    return {
        status: result.deletedCount === 1, message: result.deletedCount === 1 ? `Deleted a secret from '${serviceName}'.` : `No secrets matched the filter to delete.`, projectName, serviceName, filter, ...result
    };
};

// Count secrets in a collection
export const countSecretsInCollection = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object = {}
): Promise<dbSecretOperationResponse & { count: number }> => {
    const count = await dbClient.db(projectName).collection(serviceName).countDocuments(filter);
    return {
        status: true, message: `Counted ${count} secrets in '${serviceName}'.`, projectName, serviceName, filter, count
    };
};

// Get all secrets from a collection
export const getAllSecretsFromCollection = async (
    dbClient: MongoClient, projectName: string, serviceName: string
): Promise<dbSecretOperationResponse & { secrets: Secret[] }> => {
    const secrets = await dbClient.db(projectName).collection(serviceName).find({}).toArray() as Secret[];
    return {
        status: true, message: "Successfully retrieved all secrets.", projectName, serviceName, secrets
    };
};

// Find secrets in a collection
export const findSecretsInCollection = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object = {}
): Promise<dbSecretOperationResponse & { secrets: Secret[] }> => {
    const secrets: Secret[] = await dbClient.db(projectName).collection(serviceName).find(filter).toArray() as Secret[];
    return {
        status: true, message: `Found secrets in '${serviceName}'.`, projectName, serviceName, filter, secrets
    };
};

// Aggregate secrets in a collection
export const aggregateSecretsInCollection = async (
    dbClient: MongoClient, projectName: string, serviceName: string, pipeline: object[]
): Promise<dbSecretOperationResponse & { secrets: Secret[] }> => {
    const secrets: Secret[] = await dbClient.db(projectName).collection(serviceName).aggregate(pipeline).toArray() as Secret[];;
    return {
        status: true, message: `Aggregated secrets in '${serviceName}'.`, projectName, serviceName, secrets
    };
};

// Find a secret by name
export const findSecretByName = async (
    { dbClient, projectName, serviceName, secretName }: { dbClient: MongoClient; projectName: string; serviceName: string; secretName: string; }
): Promise<dbSecretOperationResponse & { secret?: Secret }> => {
    const secret: Secret | null = await dbClient.db(projectName).collection(serviceName).findOne({ SecretName: secretName }) as Secret;
    return {
        status: !!secret, message: secret ? `Secret with name '${secretName}' found successfully.` : `Secret with name '${secretName}' not found in '${serviceName}'.`, projectName, serviceName, secret
    };
};

export const findSecretValueByVersion = async ( dbClient: MongoClient, projectName: string, serviceName: string, secretName: string, version: string = "latest" ): Promise<dbSecretOperationResponse & { secretValue?: SecretValue }> => {
    try {
        const db = dbClient.db(projectName);
        const secret: Secret | null = await db.collection(serviceName).findOne({ SecretName: secretName }) as Secret; 

        if (!secret) {
            return { status: false, message: `Secret with name '${secretName}' not found.`, projectName, serviceName };
        }

        let secretValue: SecretValue | undefined;
        if (version === "latest") {
            const latestVersionKey = Object.keys(secret.values).sort().pop();
            secretValue = latestVersionKey ? secret.values[latestVersionKey] : undefined;
        } else {
            secretValue = secret.values[version];
        }

        if (!secretValue) {
            return { status: false, message: `Version '${version}' not found for secret '${secretName}'.`, projectName, serviceName };
        }

        return { status: true, message: `Found version '${version}' for secret '${secretName}'.`, projectName, serviceName, secretValue, };
    } catch (error) {
        console.error("Error finding secret value by version:", error);
        return { status: false, message: "An error occurred while finding the secret value.", projectName, serviceName };
    }
};
