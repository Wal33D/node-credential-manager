import { encrypt } from "../encryptionInit";
import { Secret, SecretOperationParams, SecretOperationResponse } from "./databaseTypes";

const secrets = {
    delete: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, filter = {} } = params;
        try {
            const result = await dbClient.db(projectName).collection(serviceName).deleteMany(filter);
            return { status: true, message: `Deleted ${result.deletedCount} secrets from '${serviceName}'.` };
        } catch (error) {
            console.error("Error deleting secrets:", error);
            return { status: false, message: "Failed to delete secrets." };
        }
    },

    list: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
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

    add: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, envName, envType, versions = [] } = params;
        try {
            const existingSecretByName = await dbClient.db(projectName).collection(serviceName).findOne({ secretName });
            if (existingSecretByName) {
                return { status: false, message: `Secret '${secretName}' already exists. No new secret added.` };
            }
    
            // Encrypt each version's value
            const encryptedVersions = versions.map(version => {
                if (typeof version.value !== 'string') {
                    throw new Error(`Version value must be a string. Found: ${typeof version.value}`);
                }
                const { iv, content } = encrypt({ value: version.value });
                return { ...version, value: content, iv: iv };
            });
    
            const secretData: Secret = {
                secretName,
                envName,
                envType,
                versions: encryptedVersions,
                updatedAt: new Date(),
                createdAt: new Date(),
                lastAccessAt: new Date()
            } as Secret;
    
            await dbClient.db(projectName).collection(serviceName).insertOne(secretData);
    
            const newSecret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName }) as Secret;
            return { status: true, message: `Secret '${secretName}' successfully added.`, secret: newSecret };
        } catch (error) {
            console.error("Error adding secret:", error);
            return { status: false, message: "Failed to add secret due to an error." };
        }
    },

    rename: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, newSecretName } = params;
        try {
            const existingSecretWithNewName = await dbClient.db(projectName).collection(serviceName).findOne({ secretName: newSecretName });
            if (existingSecretWithNewName) {
                return { status: false, message: `Another secret with the name '${newSecretName}' already exists in '${serviceName}'. Rename operation aborted.` };
            }

            const secret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName: secretName });
            if (!secret) {
                return { status: false, message: `Secret '${secretName}' not found in '${serviceName}'.` };
            }

            const updateResult = await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName: secretName },
                { $set: { secretName: newSecretName } }
            );

            if (updateResult.modifiedCount === 0) {
                return { status: false, message: `Failed to rename secret '${secretName}' to '${newSecretName}'.` };
            }

            const updatedSecret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName: newSecretName }) as Secret;
            return { status: true, message: `Secret '${secretName}' successfully renamed to '${newSecretName}'.`, secret: updatedSecret };
        } catch (error) {
            console.error("Error renaming secret:", error);
            return { status: false, message: "Failed to rename secret due to an error." };
        }
    }
}

export { secrets };
