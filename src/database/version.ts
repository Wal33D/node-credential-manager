import { Secret, VersionOperationResponse, AddVersionParams, UpdateVersionParams, LatestVersionParams } from "./types";

const version = {
    // Adds a version to a secret if it doesn't already exist.
    add: async (params: AddVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, version, value } = params;
        try {
            let secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || secret.credential.some(cred => cred.version === version)) {
                return {
                    status: !secret,
                    message: !secret ? `Secret '${secretName}' not found.` : `Version '${version}' already exists.`,
                    secret,
                };
            }

            await dbClient.db(projectName).collection(serviceName).updateOne({ secretName }, {
                $push: { credential: { version, value } },
                $currentDate: { lastAccessAt: true, updatedAt: true }
            } as any);

            secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            return { status: true, message: `Version '${version}' added.`, secret, credential: { version, value } };
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
                { secretName, "credential.version": version },
                { $set: { "credential.$.value": value } }
            );

            if (result.modifiedCount === 0) {
                return { status: false, message: "No secret matched or no changes needed." };
            }

            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            return { status: true, message: `Version '${version}' updated.`, secret, credential: { version, value } };
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
            if (!secret || !secret.credential || secret.credential.length === 0) {
                return {
                    status: false,
                    message: `No credentials found for secret '${secretName}'.`,
                };
            }

            const sortedCredentials = secret.credential.sort((a, b) =>
                b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' })
            );

            return { status: true, message: `Latest credential version '${sortedCredentials[0].version}' retrieved successfully.`, secret, credential: sortedCredentials[0] };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },
    // Deletes a specific version of a secret
    delete: async (params: VersionOperationParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, version } = params;
        try {
            if (!version) {
                return { status: false, message: "Version is required for delete operation." };
            }

            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret) {
                return { status: false, message: `Secret '${secretName}' not found.` };
            }

            const updatedCredentials = secret.credential.filter((cred: { version: any; }) => cred.version !== version);

            await dbClient.db(projectName).collection(serviceName).updateOne({ secretName }, { $set: { credential: updatedCredentials } });

            return { status: true, message: `Version '${version}' deleted successfully.`, secret };
        } catch (error:any) {
            console.error("Error deleting secret version:", error);
            return { status: false, message: error.message };
        }
    },

    // Deletes the most recent version of a secret
    rollback: async (params: VersionOperationParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || secret.credential.length === 0) {
                return { status: false, message: `No versions found for secret '${secretName}'.` };
            }

            secret.credential.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' }));
            const latestVersion = secret.credential.shift();

            await dbClient.db(projectName).collection(serviceName).updateOne({ secretName }, { $set: { credential: secret.credential } });

            return { status: true, message: `Rolled back successfully, removing version '${latestVersion.version}'.`, secret };
        } catch (error:any) {
            console.error("Error rolling back secret version:", error);
            return { status: false, message: error.message };
        }
    }
};


export { version };
