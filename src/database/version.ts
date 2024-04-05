import { Secret, VersionOperationResponse, AddVersionParams, Version, UpdateVersionParams, LatestVersionParams, DeleteVersionParams, RollBackVersionParams, ListVersionParams } from "./types";

const version = {

    list: async (params: ListVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret) {
                return {
                    status: false,
                    message: `Secret '${secretName}' not found.`,
                };
            }
            if (!secret.versions || secret.versions.length === 0) {
                return {
                    status: false,
                    message: `No versions found for secret '${secretName}'.`,
                };
            }
            return {
                status: true,
                message: `Found ${secret.versions.length} version(s) for secret '${secretName}'.`,
                secret,
                versions: secret.versions as Version[],
            };
        } catch (error: any) {
            console.error("Error listing secret versions:", error);
            return { status: false, message: error.message };
        }
    },
    
    // Adds a version to a secret if it doesn't already exist.
    add: async (params: AddVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName, value } = params;
        try {
            let secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            
            if (!secret || secret.versions.some(version => version.versionName === versionName)) {
                return {
                    status: !secret,
                    message: !secret ? `Secret '${secretName}' not found.` : `Version '${version}' already exists.`,
                    secret,
                };
            }

            await dbClient.db(projectName).collection(serviceName).updateOne({ secretName }, {
                $push: { version: { versionName, value } },
                $currentDate: { lastAccessAt: true, updatedAt: true }
            } as any);

            secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            return { status: true, message: `Version '${versionName}' added.`, secret, version: { versionName, value } };
        } catch (error: any) {
            console.error("Error adding/updating secret version:", error);
            return { status: false, message: error.message };
        }
    },

    // Updates an existing version of a secret.
    update: async (params: UpdateVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName, value } = params;
        try {
            const result = await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName, "version.versionName": versionName },
                { $set: { "version.$.value": value } }
            );

            if (result.modifiedCount === 0) {
                return { status: false, message: "No secret matched or no changes needed." };
            }

            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            return { status: true, message: `Version '${versionName}' updated.`, secret, version: { versionName, value } };
        } catch (error: any) {
            console.error("Error updating secret version:", error);
            return { status: false, message: error.message };
        }
    },

    // Finds and returns the latest credential entry of a secret.
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

            return { status: true, message: `Latest version '${sortedVersions[0].versionName}' retrieved successfully.`, secret, version: sortedVersions[0] };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },

    // Deletes a version by version number.
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
                { $set: { version: updatedVersions } }
            );

            if (updateResult.modifiedCount === 0) {
                return { status: false, message: "Failed to delete the specified version." };
            }

            const updatedSecret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });

            return {
                status: true,
                message: `Version '${version}' deleted successfully.`,
                secret: updatedSecret
            };
        } catch (error: any) {
            console.error("Error deleting secret version:", error);
            return { status: false, message: error.message };
        }
    },

    // Deletes the most recent version of a secret
    rollback: async (params: RollBackVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || secret.versions.length === 0) {
                return { status: false, message: `No versions found for secret '${secretName}'.` };
            }

            secret.versions.sort((a: { versionName: any; }, b: { versionName: string; }) => b.versionName.localeCompare(a.versionName, undefined, { numeric: true, sensitivity: 'base' }));
            const latestVersion = secret.versions.shift() as Version;

            await dbClient.db(projectName).collection(serviceName).updateOne({ secretName }, { $set: { credential: secret.versions } });

            return { status: true, message: `Rolled back successfully, removing version '${latestVersion.versionName}'.`, secret };
        } catch (error: any) {
            console.error("Error rolling back secret version:", error);
            return { status: false, message: error.message };
        }
    }
    
};


export { version };
