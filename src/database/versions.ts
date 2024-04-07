import { EncryptionResult } from "../types";
import { encrypt, decrypt } from "../../utils/encryptionInit";
import { Secret, LatestVersionParams, VersionOperationResponse, AddVersionParams, Version, UpdateVersionParams, DeleteVersionParams, RollBackVersionParams, ListVersionParams } from "./databaseTypes";

const versions = {
    list: async (params: ListVersionParams & { decrypted?: boolean }): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, decrypted = false } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || !secret.versions || secret.versions.length === 0) {
                return { status: false, message: `Secret '${secretName}' not found.` };
            }
    
            const processedVersions = secret.versions.map(version => processVersionDecryption(version, decrypted));
    
            return { 
                status: true, 
                message: `Found ${processedVersions.length} version(s) for secret '${secretName}'.`, 
                versions: processedVersions 
            };
        } catch (error: any) {
            console.error('Error listing secret versions:', error);
            return { status: false, message: error.message };
        }
    },
    
    add: async (params: AddVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName: providedVersionName, value } = params;

        if (typeof value !== 'string') {
            return { status: false, message: 'Value must be a string.' };
        }

        try {
            let secret: Secret | null = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });

            let versionName = providedVersionName;
            if (!versionName) {
                versionName = secret && secret.versions && secret.versions.length > 0
                    ? `v${(Math.max(...secret.versions.map(v => parseFloat(v.versionName.replace('v', '')))) + 0.1).toFixed(1)}`
                    : 'v1.0';
            }

            const existingVersion = secret?.versions.find(v => v.versionName === versionName);
            if (existingVersion) {
                return { status: false, message: `Version '${versionName}' already exists.`, versions: secret?.versions };
            }

            const encryptedValue: EncryptionResult = encrypt({ value });

            await dbClient.db(projectName).collection(serviceName).updateOne({ secretName }, {
                $push: { versions: { $each: [{ versionName, iv: encryptedValue.iv, value: encryptedValue.content }] as Version[], $position: 0 }},
                $currentDate: { lastAccessAt: true, updatedAt: true } 
            } as any);

            secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });

            return { status: true, message: `Version '${versionName}' added.`, versions: secret?.versions };
        } catch (error: any) {
            console.error('Error adding version:', error);
            return { status: false, message: error.message };
        }
    },

    update: async (params: UpdateVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName, value } = params;
        
        if (typeof value !== 'string') {
            return { status: false, message: 'Value must be a string.' };
        }

        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || !secret.versions || secret.versions.length === 0) {
                return { status: false, message: `Secret '${secretName}' not found or has no versions.` };
            }

            const versionExists = secret.versions.find(v => v.versionName === versionName);
            if (!versionExists) {
                return { status: false, message: `Version '${versionName}' does not exist.` };
            }

            const encryptedValue: EncryptionResult = encrypt({ value });

            const updateResult = await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName, "versions.versionName": versionName },
                {
                    $set: {
                        "versions.$.value": encryptedValue.content,
                        "versions.$.iv": encryptedValue.iv
                    }
                }
            );

            if (updateResult.modifiedCount === 0) {
                return { status: false, message: `No matching version '${versionName}' found or no changes needed.` };
            }

            return {
                status: true,
                message: `Version '${versionName}' updated successfully.`,
                versions: secret.versions
            };
        } catch (error: any) {
            console.error("Error updating secret version:", error);
            return { status: false, message: error.message };
        }
    },

    delete: async (params: DeleteVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName } = params;
        try {
            if (!versionName) {
                return { status: false, message: "Version is required for delete operation." };
            }

            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret) {
                return { status: false, message: `Secret '${secretName}' not found.` };
            }

            const versionExists = secret.versions.some(version => version.versionName === versionName);
            if (!versionExists) {
                return { status: false, message: `Version '${versionName}' not found in secret '${secretName}'.` };
            }

            const updatedVersions = secret.versions.filter(version => version.versionName !== versionName);
            const updateResult = await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName },
                { $set: { versions: updatedVersions } }
            );

            if (updateResult.modifiedCount === 0) {
                return { status: false, message: "Failed to delete the specified version." };
            }

            const updatedSecret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName }) as Secret;

            return {
                status: true,
                message: `Version '${versionName}' deleted successfully.`,
                versions: updatedSecret.versions
            };
        } catch (error: any) {
            console.error("Error deleting version:", error);
            return { status: false, message: error.message };
        }
    },
     rollback: async (params: RollBackVersionParams & { decrypted?: boolean }): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, decrypted = false } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || secret.versions.length <= 1) {
                return { status: false, message: `No versions found for secret '${secretName}'.` };
            }
    
            // Remove the latest version from the list
            const latestVersion = secret.versions.shift();
            if (!latestVersion) {
                return { status: false, message: `Failed to roll back because no versions exist.`, versions: secret.versions || [] };
            }
    
            // Update the database to reflect the rollback
            await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName },
                { $set: { versions: secret.versions } }
            );
    
            const processedLatestVersion = processVersionDecryption(latestVersion, decrypted);
            const versionsForResponse = [processedLatestVersion, ...secret.versions.map(version => processVersionDecryption(version, decrypted))];
    
            return {
                status: true,
                message: `Rolled back successfully, removing version '${processedLatestVersion.versionName}'.`,
                versions: versionsForResponse
            };
        } catch (error: any) {
            console.error("Error rolling back secret version:", error);
            return { status: false, message: error.message };
        }
    },

    latest: async (params: LatestVersionParams & { decrypted?: boolean }): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, decrypted = false } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || !secret.versions || secret.versions.length === 0) {
                return {
                    status: false,
                    message: `No versions found for secret '${secretName}'.`,
                };
            }
    
            const sortedVersions = secret.versions.sort((a, b) =>
                b.versionName.localeCompare(a.versionName, undefined, { numeric: true, sensitivity: 'base' })
            );
            const latestVersion = sortedVersions[0];
    
            const processedLatestVersion = processVersionDecryption(latestVersion, decrypted);
    
            return {
                status: true,
                message: `Latest version '${latestVersion.versionName}' retrieved${decrypted ? " and decrypted" : ""} successfully.`,
                version: processedLatestVersion
            };
        } catch (error: any) {
            console.error("Error retrieving or decrypting the latest version:", error);
            return { status: false, message: `Failed to retrieve or decrypt the latest version due to an error: ${error.message}` };
        }
    },
}

const processVersionDecryption = (version: Version, decrypted: boolean): Version => {
    if (decrypted && version.iv) {
        const decryptedValue = decrypt({ hash: { iv: version.iv, content: version.value } });
        const { iv, ...versionWithoutIv } = version;
        return { ...versionWithoutIv, value: decryptedValue };
    } else {
        return version;
    }
};

export { versions };
