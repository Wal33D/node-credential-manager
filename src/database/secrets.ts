import { MongoClient, ObjectId } from "mongodb";
import { Secret } from "./types";

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

export interface DeleteResult {
    deletedCount: number;
}

// Delete secrets from a collection
export const deleteSecretsFromService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object
): Promise<any> => {
    const result: DeleteResult = await dbClient.db(projectName).collection(serviceName).deleteMany(filter);
    return {
        status: true, message: `Deleted ${result.deletedCount} secrets from '${serviceName}'.`, projectName, serviceName, filter, ...result
    };
};

// Delete an individual secret from a collection
export const deleteSecretFromService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object
): Promise<any > => {
    const result: DeleteResult = await dbClient.db(projectName).collection(serviceName).deleteOne(filter);
    return {
        status: result.deletedCount === 1, message: result.deletedCount === 1 ? `Deleted a secret from '${serviceName}'.` : `No secrets matched the filter to delete.`, projectName, serviceName, filter, ...result
    };
};

// Count secrets in a collection
export const countSecretsInService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object = {}
): Promise<any> => {
    const count = await dbClient.db(projectName).collection(serviceName).countDocuments(filter);
    return {
        status: true, message: `Counted ${count} secrets in '${serviceName}'.`, projectName, serviceName, filter, count
    };
};

// Get all secrets from a collection
export const getAllSecretsFromService = async (
    dbClient: MongoClient, projectName: string, serviceName: string
): Promise<any> => {
    const secrets = await dbClient.db(projectName).collection(serviceName).find({}).toArray() as Secret[];
    return {
        status: true, message: "Successfully retrieved all secrets.", projectName, serviceName, secrets
    };
};

// Find secrets in a collection
export const findSecretsInService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object = {}
): Promise<any> => {
    const secrets: Secret[] = await dbClient.db(projectName).collection(serviceName).find(filter).toArray() as Secret[];
    return {
        status: true, message: `Found secrets in '${serviceName}'.`, projectName, serviceName, filter, secrets
    };
};

// Find a secret by name
export const findSecretByName = async (
    { dbClient, projectName, serviceName, secretName }: { dbClient: MongoClient; projectName: string; serviceName: string; secretName: string; }
): Promise<any> => {
    const secret: Secret | null = await dbClient.db(projectName).collection(serviceName).findOne({ SecretName: secretName }) as Secret;
    return {
        status: !!secret, message: secret ? `Secret with name '${secretName}' found successfully.` : `Secret with name '${secretName}' not found in '${serviceName}'.`, projectName, serviceName, secret
    };
};

export const addSecret = async ({
    dbClient,
    projectName,
    serviceName,
    secretName,
    envName,
    envType,
    version }: {
        dbClient: MongoClient,
        projectName: string,
        serviceName: string,
        secretName: string,
        envName: string,
        envType: 'production' | 'test' | 'development',
        version: { versionName: string, value: string }
    }
): Promise<dbSecretOperationResponse> => {
    try {
        // First, check if a secret with the same name already exists
        const existingSecret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName: secretName });
        if (existingSecret) {
            // If a secret with the same name exists, do not add a new one and return a response
            return {
                status: false,
                message: `A secret with the name '${secretName}' already exists in service '${serviceName}' within project '${projectName}'. No new secret was added.`,
                projectName,
                serviceName,
            };
        }

        // If no existing secret was found, proceed to add the new secret
        const secretData: Secret = {
            secretName: secretName,
            envName: envName,
            envType: envType,
            versions: [version] ,
            updatedAt: new Date(),
            createdAt: new Date(),
            lastAccessAt: new Date(),
            _id: new ObjectId()
        };

        const result = await dbClient.db(projectName).collection(serviceName).insertOne(secretData);

        if (result.insertedId) {
            return { status: true, message: `Secret '${secretName}' added successfully to service '${serviceName}' in project '${projectName}'. New secret ID: ${result.insertedId}.`, projectName, serviceName, secret: { ...secretData, _id: result.insertedId }, };
        } else {
            // This block is theoretically unreachable because insertOne throws an error if it fails
            return { status: false, message: `Failed to add the secret '${secretName}'.`, projectName, serviceName, };
        }
    } catch (error) {
        console.error("Error adding secret:", error);
        return { status: false, message: "An error occurred while adding the secret.", projectName, serviceName, };
    }
};
