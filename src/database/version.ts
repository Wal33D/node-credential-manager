import { Secret, VersionOperationResponse, AddVersionParams, Version, UpdateVersionParams, LatestVersionParams, DeleteVersionParams, RollBackVersionParams, ListVersionParams } from "./databaseTypes";
import { encrypt, decrypt } from "../encryptionInit";

const version = {

    list: async (params: ListVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret) {
                return { status: false, message: `Secret '${secretName}' not found.` };
            }
            if (!secret.versions || secret.versions.length === 0) {
                return { status: false, message: `No versions found for secret '${secretName}'.` };
            }

            const decryptedVersions = secret.versions.map(version => ({
                ...version,
                value: decrypt({ hash: { iv: version.iv, content: version.value }})
            }));

            return { status: true, message: `Found ${decryptedVersions.length} version(s) for secret '${secretName}'.`, versions: decryptedVersions };
        } catch (error: any) {
            console.error('Error listing secret versions:', error);
            return { status: false, message: error.message };
        }
    },
    add: async (params: AddVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName: providedVersionName, value } = params;
        try {
            let secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });

            let versionName = providedVersionName;
            if (!versionName) {
                versionName = secret && secret.versions && secret.versions.length > 0
                    ? `v${Math.max(...secret.versions.map(v => parseFloat(v.versionName.replace('v', '')))) + 0.1}`
                    : 'v1.0';
            }

            const existingVersion = secret?.versions.find(version => version.versionName === versionName);
            if (existingVersion) {
                return { status: false, message: `Version '${versionName}' already exists.`, versions: secret?.versions };
            }

            const encryptedValue = encrypt({ value });

            await dbClient.db(projectName).collection(serviceName).updateOne({ secretName }, {
                $push: { versions: { $each: [{ versionName, ...encryptedValue }], $position: 0 }},
                $currentDate: { lastAccessAt: true, updatedAt: true }
            } as any);

            return { status: true, message: `Version '${versionName}' added.`, versions: secret.versions };
        } catch (error: any) {
            console.error('Error adding version:', error);
            return { status: false, message: error.message };
        }
    },

    update: async (params: UpdateVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName, value } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || !secret.versions || secret.versions.length === 0) {
                return { status: false, message: `Secret '${secretName}' not found or has no versions.` };
            }

            const versionExists = secret.versions.find(v => v.versionName === versionName);
            if (!versionExists) {
                return { status: false, message: `Version '${versionName}' does not exist.` };
            }

            const encryptedValue = encrypt(value);

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

    latest: async (params: LatestVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName } = params;
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
            const decryptedValue = decrypt({ iv: latestVersion.iv, content: latestVersion.value });
            const decryptedLatestVersion = {
                ...latestVersion,
                value: decryptedValue
            };

            return {
                status: true,
                message: `Latest version '${decryptedLatestVersion.versionName}' retrieved successfully.`,
                version: decryptedLatestVersion
            };
        } catch (error: any) {
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
                return { status: false, message: `Version '${version}' not found in secret '${secretName}'.` };
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
    rollback: async (params: RollBackVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || secret.versions.length === 0) {
                return { status: false, message: `No versions found for secret '${secretName}'.` };
            }

            const latestVersion = secret.versions.shift();

            await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName },
                { $set: { versions: secret.versions } }
            );

            if (latestVersion) {
                return { status: true, message: `Rolled back successfully, removing version '${latestVersion.versionName}'.`, versions: secret.versions };
            } else {
                return { status: false, message: `Failed to roll back.`, versions: secret.versions || [] };
            }
        } catch (error: any) {
            console.error("Error rolling back secret version:", error);
            return { status: false, message: error.message };
        }
    }

}


export { version };
