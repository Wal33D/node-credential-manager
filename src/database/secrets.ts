import { Secret, SecretOperationParams, SecretOperationResponse, Version } from "./types";

const secrets = {
    deleteSecretsFromService: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, filter = {} } = params;
        try {
            const result = await dbClient.db(projectName).collection(serviceName).deleteMany(filter);
            return { status: true, message: `Deleted ${result.deletedCount} secrets from '${serviceName}'.` };
        } catch (error) {
            console.error("Error deleting secrets:", error);
            return { status: false, message: "Failed to delete secrets." };
        }
    },

    getAllSecretsFromService: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName } = params;
        try {
            const secrets = await dbClient.db(projectName).collection(serviceName).find({}).toArray() as Secret[];
            return { status: true, message: "All secrets retrieved successfully.", secrets };
        } catch (error) {
            console.error("Error retrieving all secrets:", error);
            return { status: false, message: "Failed to retrieve secrets." };
        }
    },

    find: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, filter = {} } = params;
        try {
            const secrets = await dbClient.db(projectName).collection(serviceName).find(filter).toArray() as Secret[];
            return { status: true, message: `Secrets found in '${serviceName}'.`, secrets };
        } catch (error) {
            console.error("Error finding secrets:", error);
            return { status: false, message: "Failed to find secrets." };
        }
    },

    findByName: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName }) as Secret;
            return { status: !!secret, message: secret ? `Secret '${secretName}' found.` : `Secret '${secretName}' not found in '${serviceName}'.`, secret };
        } catch (error) {
            console.error("Error finding secret by name:", error);
            return { status: false, message: `Failed to find secret '${secretName}'.` };
        }
    },

    addSecret: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, envName, envType, versions } = params;
        try {
            const existingSecret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName });
            if (existingSecret) {
                return { status: false, message: `Secret '${secretName}' exists. No new secret added.` };
            }

            const secretData: Secret = { secretName, envName, envType, versions, updatedAt: new Date(), createdAt: new Date(), lastAccessAt: new Date() } as Secret;
            await dbClient.db(projectName).collection(serviceName).insertOne(secretData);

            const newSecret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName }) as Secret;
            return { status: true, message: `Secret '${secretName}' successfully added.`, secret: newSecret };
        } catch (error) {
            console.error("Error adding secret:", error);
            return { status: false, message: "Failed to add secret." };
        }
    }
};

export { secrets };
