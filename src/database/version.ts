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

            if (!secret.version || secret.version.length === 0) {
                return {
                    status: false,
                    message: `No versions found for secret '${secretName}'.`,
                };
            }

            return {
                status: true,
                message: `Found ${secret.version.length} version(s) for secret '${secretName}'.`,
                secret,
                versions: secret.version as Version[],
            };
        } catch (error: any) {
            console.error("Error listing secret versions:", error);
            return { status: false, message: error.message };
        }
    },
    
    // Adds a version to a secret if it doesn't already exist.
    add: async (params: AddVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, version, value } = params;
        try {
            let secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || secret.version.some(cred => cred.version === version)) {
                return {
                    status: !secret,
                    message: !secret ? `Secret '${secretName}' not found.` : `Version '${version}' already exists.`,
                    secret,
                };
            }

            await dbClient.db(projectName).collection(serviceName).updateOne({ secretName }, {
                $push: { version: { version, value } },
                $currentDate: { lastAccessAt: true, updatedAt: true }
            } as any);

            secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            return { status: true, message: `Version '${version}' added.`, secret, version: { version, value } };
        } catch (error: any) {
            console.error("Error adding/updating secret version:", error);
            return { status: false, message: error.message };
        }
    },

    // Updates an existing version of a secret.
    update: async (params: UpdateVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, version, value } = params;
        try {
            const result = await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName, "version.version": version },
                { $set: { "version.$.value": value } }
            );

            if (result.modifiedCount === 0) {
                return { status: false, message: "No secret matched or no changes needed." };
            }

            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            return { status: true, message: `Version '${version}' updated.`, secret, version: { version, value } };
        } catch (error: any) {
            console.error("Error updating secret version:", error);
            return { status: false, message: error.message };
        }
    },

    // Finds and returns the latest version entry of a secret.
    latest: async (params: LatestVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || !secret.version || secret.version.length === 0) {
                return {
                    status: false,
                    message: `No versions found for secret '${secretName}'.`,
                };
            }

            const sortedVersions = secret.version.sort((a, b) =>
                b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' })
            );

            return { status: true, message: `Latest version version '${sortedVersions[0].version}' retrieved successfully.`, secret, version: sortedVersions[0] };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },

    // Deletes a version by version number.
    delete: async (params: DeleteVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, version } = params;
        try {
            if (!version) {
                return { status: false, message: "Version is required for delete operation." };
            }

            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret) {
                return { status: false, message: `Secret '${secretName}' not found.` };
            }

            const versionExists = secret.version.some(cred => cred.version === version);
            if (!versionExists) {
                return { status: false, message: `Version '${version}' not found in secret '${secretName}'.` };
            }

            const updatedVersions = secret.version.filter(cred => cred.version !== version);
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
            if (!secret || secret.version.length === 0) {
                return { status: false, message: `No versions found for secret '${secretName}'.` };
            }

            secret.version.sort((a: { version: any; }, b: { version: string; }) => b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' }));
            const latestVersion = secret.version.shift() as Version;

            await dbClient.db(projectName).collection(serviceName).updateOne({ secretName }, { $set: { version: secret.version } });

            return { status: true, message: `Rolled back successfully, removing version '${latestVersion.version}'.`, secret };
        } catch (error: any) {
            console.error("Error rolling back secret version:", error);
            return { status: false, message: error.message };
        }
    }
    
};


export { version };
