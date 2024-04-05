import { MongoClient, ObjectId } from "mongodb";
import { Secret, Version } from "./types";

export interface dbSecretOperationResponse {
    status: boolean;
    message: string;
    projectName: string;
    serviceName: string;
    secretName?: string;
    filter?: object;
    secret?: Secret;
    secrets?: Secret[];
    version?: any;
}

// Utility function for creating a standard error response
const createErrorResponse = (message: string, projectName: string, serviceName: string): dbSecretOperationResponse => ({
    status: false,
    message,
    projectName,
    serviceName,
});

// Delete secrets from a collection
export const deleteSecretsFromService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object = {}
): Promise<dbSecretOperationResponse> => {
    try {
        const result = await dbClient.db(projectName).collection(serviceName).deleteMany(filter);
        const message = `Deleted ${result.deletedCount} secrets from '${serviceName}'.`;
        return { status: true, message, projectName, serviceName, filter };
    } catch (error) {
        console.error("Error deleting secrets:", error);
        return createErrorResponse("An error occurred while deleting secrets.", projectName, serviceName);
    }
};

// Get all secrets from a collection
export const getAllSecretsFromService = async (
    dbClient: MongoClient, projectName: string, serviceName: string
): Promise<dbSecretOperationResponse> => {
    try {
        const secrets = await dbClient.db(projectName).collection(serviceName).find({}).toArray() as Secret[];
        return { status: true, message: "Successfully retrieved all secrets.", projectName, serviceName, secrets  };
    } catch (error) {
        console.error("Error retrieving all secrets:", error);
        return createErrorResponse("An error occurred while retrieving secrets.", projectName, serviceName);
    }
};

// Find secrets in a collection
export const findSecretsInService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object = {}
): Promise<dbSecretOperationResponse> => {
    try {
        const secrets = await dbClient.db(projectName).collection(serviceName).find(filter).toArray() as Secret[];
        return { status: true, message: `Found secrets in '${serviceName}'.`, projectName, serviceName, filter, secrets };
    } catch (error) {
        console.error("Error finding secrets:", error);
        return createErrorResponse("An error occurred while finding secrets.", projectName, serviceName);
    }
};

// Find a secret by name
export const findSecretByName = async (
    dbClient: MongoClient, projectName: string, serviceName: string, secretName: string
): Promise<dbSecretOperationResponse> => {
    try {
        const secret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName }) as Secret;
        const message = secret ? `Secret with name '${secretName}' found successfully.` : `Secret with name '${secretName}' not found in '${serviceName}'.`;
        return { status: !!secret, message, projectName, serviceName, secretName, secret };
    } catch (error) {
        console.error("Error finding secret by name:", error);
        return createErrorResponse(`An error occurred while finding the secret '${secretName}'.`, projectName, serviceName);
    }
};

// Add a new secret
export const addSecret = async ({
    dbClient, projectName, serviceName, secretName, envName, envType, versions
}: {
    dbClient: MongoClient,
    projectName: string,
    serviceName: string,
    secretName: string,
    envName: string,
    envType: 'production' | 'test' | 'development',
    versions: Version[]
}): Promise<dbSecretOperationResponse> => {
    try {
        const existingSecret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName });
        if (existingSecret) {
            return createErrorResponse(`A secret with the name '${secretName}' already exists in service '${serviceName}' within project '${projectName}'. No new secret was added.`, projectName, serviceName);
        }

        const secretData: Secret = { secretName, envName, envType, versions, updatedAt: new Date(), createdAt: new Date(), lastAccessAt: new Date(), _id: new ObjectId() };
        const result = await dbClient.db(projectName).collection(serviceName).insertOne(secretData);

        return { status: true, message: `Secret '${secretName}' added successfully to service '${serviceName}' in project '${projectName}'.`, projectName, serviceName, secret: secretData };
    } catch (error) {
        console.error("Error adding secret:", error);
        return createErrorResponse("An error occurred while adding the secret.", projectName, serviceName);
    }
};
