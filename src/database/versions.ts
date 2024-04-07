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
    
    add: async (params: AddVersionParams & { decrypted?: boolean }): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName: providedVersionName, value, decrypted = false } = params;
    
        if (typeof value !== 'string') {
            return { status: false, message: 'Value must be a string.' };
        }
    
        try {
            let secret: Secret | null = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
    
            // Ensure versionName is in the format vX.Y, where X and Y are digits.
            let versionName = providedVersionName;
            if (!versionName || !/^v\d+(\.\d+)?$/.test(versionName)) {
                const nextVersionNumber = secret && secret.versions && secret.versions.length > 0
                    ? `v${(Math.max(...secret.versions.map(v => parseFloat(v.versionName.replace('v', '')))) + 0.1).toFixed(1)}`
                    : 'v1.0';
                versionName = nextVersionNumber;
            }
    
            const existingVersion = secret?.versions.find(v => v.versionName === versionName);
            if (existingVersion) {
                return { status: false, message: `Version '${versionName}' already exists.`, versions: secret?.versions };
            }
    
            const encryptedValue: EncryptionResult = encrypt({ value });
    
            await dbClient.db(projectName).collection(serviceName).updateOne({ secretName }, {
                $push: { versions: { $each: [{ versionName, iv: encryptedValue.iv, value: encryptedValue.content }], $position: 0 }},
                $currentDate: { lastAccessAt: true, updatedAt: true }
            } as any);
    
            // Fetch the updated secret to include in the response
            secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
    
            // If decryption is requested, decrypt the added version value for the response
            const processedVersions = secret?.versions.map(version => 
                version.versionName === versionName && decrypted
                    ? processVersionDecryption(version, true)
                    : version
            );
    
            return { status: true, message: `Version '${versionName}' added successfully.`, versions: processedVersions };
        } catch (error: any) {
            console.error('Error adding version:', error);
            return { status: false, message: error.message };
        }
    },
    
    update: async (params: UpdateVersionParams & { decrypted?: boolean }): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName, value, decrypted = false } = params;
        
        if (typeof value !== 'string') {
            return { status: false, message: 'Value must be a string.' };
        }
    
        // Validate versionName format (vX.Y)
        if (!/^v\d+(\.\d+)?$/.test(versionName as string)) {
            return { status: false, message: `Version name '${versionName}' does not follow the required 'vX.Y' format.` };
        }
    
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || !secret.versions || secret.versions.length === 0) {
                return { status: false, message: `Secret '${secretName}' not found or has no versions.` };
            }
    
            const versionIndex = secret.versions.findIndex(v => v.versionName === versionName);
            if (versionIndex === -1) {
                return { status: false, message: `Version '${versionName}' does not exist.` };
            }
    
            const encryptedValue: EncryptionResult = encrypt({ value });
    
            // Update the specific version in the database
            secret.versions[versionIndex].value = encryptedValue.content;
            secret.versions[versionIndex].iv = encryptedValue.iv;
    
            const updateResult = await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName },
                { $set: { versions: secret.versions } }
            );
    
            if (updateResult.modifiedCount === 0) {
                return { status: false, message: `No matching version '${versionName}' found or no changes needed.` };
            }
    
            // Decrypt the updated version if requested before including it in the response
            const processedVersions = secret.versions.map(version => 
                version.versionName === versionName && decrypted
                    ? processVersionDecryption(version, true)
                    : version
            );
    
            return {
                status: true,
                message: `Version '${versionName}' updated successfully.`,
                versions: processedVersions
            };
        } catch (error: any) {
            console.error("Error updating secret version:", error);
            return { status: false, message: error.message };
        }
    },
    delete: async (params: DeleteVersionParams & { decrypted?: boolean }): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName, decrypted = false } = params;
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
    
            // Remove the specified version
            const updatedVersions = secret.versions.filter(version => version.versionName !== versionName);
            const updateResult = await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName },
                { $set: { versions: updatedVersions } }
            );
    
            if (updateResult.modifiedCount === 0) {
                return { status: false, message: "Failed to delete the specified version." };
            }
    
            // Decrypt the remaining versions if requested
            const processedVersions = decrypted ? updatedVersions.map(version => processVersionDecryption(version, true)) : updatedVersions;
    
            return {
                status: true,
                message: `Version '${versionName}' deleted successfully.`,
                versions: processedVersions
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
            if (!secret || secret.versions.length === 0) {
                return { status: false, message: `No versions found for secret '${secretName}'.` };
            }
            
            // Remove the latest version from the list
            const latestVersion = secret.versions.shift();
            if (!latestVersion) {
                return { status: false, message: `Failed to roll back because no versions exist.`, versions: [] };
            }
            
            // Update the database to reflect the rollback
            await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName },
                { $set: { versions: secret.versions } }
            );
            
            // Fetch the updated secret to ensure we have the latest state
            const updatedSecret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!updatedSecret) {
                // This should not happen but added for completeness
                return { status: false, message: `Failed to fetch the updated secret post-rollback.` };
            }
    
            // Decrypt the remaining versions if requested
            const processedVersions = decrypted 
                ? updatedSecret.versions.map(version => processVersionDecryption(version, true)) 
                : updatedSecret.versions;
    
            return {
                status: true,
                message: `Rolled back successfully, removing version '${latestVersion.versionName}'.`,
                versions: processedVersions
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
