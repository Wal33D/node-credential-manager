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

                versions: secret.versions as Version[],
            };
        } catch (error: any) {
            console.error("Error listing secret versions:", error);
            return { status: false, message: error.message };
        }
    },
// Adds a version to a secret, automatically assigning a versionName if none is provided.
add: async (params: AddVersionParams): Promise<VersionOperationResponse> => {
    const { dbClient, projectName, serviceName, secretName, versionName: providedVersionName, value } = params;
    try {
        let secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });

        // Automatically determine the versionName if not provided
        let versionName = providedVersionName;
        if (!versionName) {
            if (!secret || !secret.versions || secret.versions.length === 0) {
                versionName = "v1.0"; // Default version name if no versions exist
            } else {
                // Calculate the next version name based on existing versions
                const versions = secret.versions.map(v => v.versionName.replace('v', ''));
                const highestVersion = Math.max(...versions.map(v => parseFloat(v)));
                versionName = 'v' + (highestVersion + 0.1).toFixed(1);
            }
        }

        // If the version already exists, return that version instead of adding a new one
        const existingVersion = secret?.versions.find(version => version.versionName === versionName);
        if (existingVersion) {
            return {
                status: false,
                message: `Version '${versionName}' already exists.`,
                secret,
                version: existingVersion // Return the existing version that matches the versionName
            };
        }

        // Add the version
        await dbClient.db(projectName).collection(serviceName).updateOne(
            { secretName },
            {
                $push: { versions: { versionName, value } },
                $currentDate: { lastAccessAt: true, updatedAt: true }
            } as any
        );

        secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
        return {
            status: true,
            message: `Version '${versionName}' added.`,
            secret,
            version: { versionName, value }, // Return the newly added version
        };
    } catch (error: any) {
        console.error("Error adding version:", error);
        return { status: false, message: error.message };
    }
},

    // Updates an existing version of a secret.
    update: async (params: UpdateVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName, value } = params;
        try {
            // Correcting the filter to match an element within the "versions" array.
            const filter = { secretName, "versions.versionName": versionName };
            const update = {
                $set: { "versions.$.value": value } // Correctly target the nested document in the "versions" array.
            };

            const result = await dbClient.db(projectName).collection(serviceName).updateOne(filter, update);

            if (result.modifiedCount === 0) {
                return { status: false, message: `No matching version '${versionName}' found or no changes needed.` };
            }

            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            return { status: true, message: `Version '${versionName}' updated successfully.`, version: { versionName, value } };
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

            return { status: true, message: `Latest version '${sortedVersions[0].versionName}' retrieved successfully.`, version: sortedVersions[0] };
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
                { $set: { versions: updatedVersions } }
            );

            if (updateResult.modifiedCount === 0) {
                return { status: false, message: "Failed to delete the specified version." };
            }

            const updatedSecret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });

            return {
                status: true,
                message: `Version '${versionName}' deleted successfully.`,
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

            // Assuming the last item in the versions array is the most recent
            const latestVersion = secret.versions.pop(); // Removes and returns the last item

            await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName },
                { $set: { versions: secret.versions } } // Updates the document with the version removed
            );

            if (latestVersion) {
                return { status: true, message: `Rolled back successfully, removing version '${latestVersion.versionName}'.`, secret };
            } else {
                return { status: false, message: `Failed to roll back.`, secret };
            }
        } catch (error: any) {
            console.error("Error rolling back secret version:", error);
            return { status: false, message: error.message };
        }
    }
}


export { version };
