import { decrypt, encrypt } from "../encryptionInit";
import { Secret, SecretOperationParams, SecretOperationResponse, Version } from "./databaseTypes";

const secrets = {
    delete: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, filter = {} } = params;
        try {
            const result = await dbClient.db(projectName).collection(serviceName).deleteMany(filter);
            return { status: true, message: `Deleted ${result.deletedCount} secrets from '${serviceName}'.` ,projectName,serviceName};
        } catch (error) {
            console.error("Error deleting secrets:", error);
            return { status: false, message: "Failed to delete secrets." ,projectName,serviceName};
        }
    },

    add: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, envName, envType, versions = [] } = params;

        try {
            const existingSecretByName = await dbClient.db(projectName).collection(serviceName).findOne({ secretName });
            if (existingSecretByName) {
                return { status: false, message: `Secret '${secretName}' already exists. No new secret added.` ,projectName,serviceName};
            }
            const encryptedVersions: Version[] = versions.map(version => {
                if (typeof version.value !== 'string') {
                    throw new Error(`Version value must be a string. Found: ${typeof version.value}`);
                }
                const encrypted = encrypt({ value: version.value });
                return { ...version, value: encrypted.content, iv: encrypted.iv };
            });

            const secretData: Secret = {
                secretName,
                envName,
                envType,
                versions: encryptedVersions,
                updatedAt: new Date(),
                createdAt: new Date(),
                lastAccessAt: new Date(),
            } as Secret;

            await dbClient.db(projectName).collection(serviceName).insertOne(secretData);

            const newSecret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName }) as Secret;
            return { status: true, message: `Secret '${secretName}' successfully added.`, secret: newSecret ,projectName,serviceName};
        } catch (error) {
            console.error("Error adding secret:", error);
            return { status: false, message: "Failed to add secret due to an error." ,projectName,serviceName};
        }
    },
    rename: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, newSecretName } = params;
        try {
            const existingSecretWithNewName = await dbClient.db(projectName).collection(serviceName).findOne({ secretName: newSecretName });
            if (existingSecretWithNewName) {
                return { status: false, message: `Another secret with the name '${newSecretName}' already exists in '${serviceName}'. Rename operation aborted.` ,projectName,serviceName};
            }
            serviceName
            const secret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName: secretName });
            if (!secret) {
                return { status: false, message: `Secret '${secretName}' not found in '${serviceName}'.` ,projectName,serviceName};
            }

            const updateResult = await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName: secretName },
                { $set: { secretName: newSecretName } }
            );

            if (updateResult.modifiedCount === 0) {
                return { status: false, message: `Failed to rename secret '${secretName}' to '${newSecretName}'.` ,projectName,serviceName};
            }

            const updatedSecret = await dbClient.db(projectName).collection(serviceName).findOne({ secretName: newSecretName }) as Secret;
            return { status: true, message: `Secret '${secretName}' successfully renamed to '${newSecretName}'.`, secret: updatedSecret,projectName,serviceName };
        } catch (error) {
            console.error("Error renaming secret:", error);
            return { status: false, message: "Failed to rename secret due to an error.",projectName,serviceName };
        }
    },
    list: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName } = params;
        try {
            const secretsArray = await dbClient.db(projectName).collection(serviceName).find({}).toArray() as Secret[];
            const decryptedSecrets = secretsArray.map(secret => ({
                ...secret,
                versions: secret.versions.map(({ iv, ...version }) => {
                    if (iv) {
                        return { ...version, value: decrypt({ hash: { iv, content: version.value } }) };
                    }
                    return version;
                })
            }));
    
            return { status: true, message: "All secrets retrieved successfully.", secrets: decryptedSecrets, projectName, serviceName };
        } catch (error) {
            console.error("Error retrieving all secrets:", error);
            return { status: false, message: "Failed to retrieve secrets.", projectName, serviceName };
        }
    },    
    find: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, filter = {} } = params;
        try {
            const secretsArray = await dbClient.db(projectName).collection(serviceName).find(filter).toArray() as Secret[];
            const decryptedSecrets = secretsArray.map(secret => ({
                ...secret,
                versions: secret.versions.map(({ iv, ...version }) => {
                    if (iv) {
                        return { ...version, value: decrypt({ hash: { iv, content: version.value } }) };
                    }
                    return version;
                })
            }));
    
            return { status: true, message: `Secrets found in '${serviceName}'.`, secrets: decryptedSecrets, projectName, serviceName };
        } catch (error) {
            console.error("Error finding secrets:", error);
            return { status: false, message: "Failed to find secrets.", projectName, serviceName };
        }
    },    
    findByName: async (params: SecretOperationParams): Promise<SecretOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName } = params;
        try {
            let secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret) {
                return { status: false, message: `Secret '${secretName}' not found in '${serviceName}'.`, projectName, serviceName };
            }
    
            if (secret.versions && secret.versions.length > 0) {
                const decryptedVersions = secret.versions.map(({ iv, ...version }) => {
                    if (iv) {
                        return { ...version, value: decrypt({ hash: { iv, content: version.value } }) };
                    }
                    return version;
                });
                secret = { ...secret, versions: decryptedVersions };
            }
    
            return { status: true, message: `Secret '${secretName}' found.`, projectName, serviceName, secret };
        } catch (error) {
            console.error("Error finding secret by name:", error);
            return { status: false, message: `Failed to find secret '${secretName}'.`, projectName, serviceName };
        }
    }    
}

export { secrets };
