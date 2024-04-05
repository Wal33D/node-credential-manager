import { MongoClient, ObjectId } from "mongodb";
import { EnvType, Secret, Version } from "./types";



const createErrorResponse = (message: string): any => ({
    status: false,
    message,
});

// Delete secrets from a collection
export const deleteSecretsFromService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object = {}
): Promise<any> => {
    try {
        const result = await dbClient.db(projectName).collection(serviceName).deleteMany(filter);
        const message = `Deleted ${result.deletedCount} secrets from '${serviceName}'.`;
        return { status: true, message };
    } catch (error) {
        console.error("Error deleting secrets:", error);
        return createErrorResponse("An error occurred while deleting secrets.");
    }
};

// Get all secrets from a collection
export const getAllSecretsFromService = async (
    dbClient: MongoClient, projectName: string, serviceName: string
): Promise<any> => {
    try {
        const secrets = await dbClient.db(projectName).collection(serviceName).find({}).toArray() as Secret[];
        return { status: true, message: "Successfully retrieved all secrets.", secrets };
    } catch (error) {
        console.error("Error retrieving all secrets:", error);
        return createErrorResponse("An error occurred while retrieving secrets.");
    }
};

// Find secrets in a collection
export const findSecretsInService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object = {}
): Promise<any> => {
    try {
        const secrets = await dbClient.db(projectName).collection(serviceName).find(filter).toArray() as Secret[];
        return { status: true, message: `Found secrets in '${serviceName}'.`, secrets };
    } catch (error) {
        console.error("Error finding secrets:", error);
        return createErrorResponse("An error occurred while finding secrets.",);
    }
};

// Find a secret by name
export const findSecretByName = async (
    dbClient: MongoClient, projectName: string, serviceName: string, secretName: string
): Promise<any> => {
    try {
        const secret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName }) as Secret;
        const message = secret ? `Secret with name '${secretName}' found successfully.` : `Secret with name '${secretName}' not found in '${serviceName}'.`;
        return { status: !!secret, message, secret };
    } catch (error) {
        console.error("Error finding secret by name:", error);
        return createErrorResponse(`An error occurred while finding the secret '${secretName}'.`);
    }
};

export const addSecret = async ({
    dbClient, projectName, serviceName, secretName, envName, envType, versions
}: {
    dbClient: MongoClient,
    projectName: string,
    serviceName: string,
    secretName: string,
    envName: string,
    envType: EnvType,
    versions: Version[],
}): Promise<any> => {
    try {
        const existingSecret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName });
        if (existingSecret) {
            return createErrorResponse(`A secret with the name '${secretName}' already exists in service '${serviceName}' within project '${projectName}'. No new secret was added.`);
        }

        const secretData: Secret = { secretName, envName, envType, versions, updatedAt: new Date(), createdAt: new Date(), lastAccessAt: new Date(), _id: new ObjectId() };
        await dbClient.db(projectName).collection(serviceName).insertOne(secretData);

        const newSecret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName });

        return { status: true, message: `Secret '${secretName}' added successfully to service '${serviceName}' in project '${projectName}'.`, secret: newSecret as Secret };
    } catch (error) {
        console.error("Error adding secret:", error);
        return createErrorResponse("An error occurred while adding the secret.");
    }
};
