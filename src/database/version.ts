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
    add: async (params: AddVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName, versionName: providedVersionName, value } = params;
        try {
            let secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });

            let versionName = providedVersionName;
            if (!versionName) {
                if (!secret || !secret.versions || secret.versions.length === 0) {
                    versionName = "v1.0";
                } else {
                    const versions = secret.versions.map(v => v.versionName.replace('v', ''));
                    const highestVersion = Math.max(...versions.map(v => parseFloat(v)));
                    versionName = 'v' + (highestVersion + 0.1).toFixed(1);
                }
            }

            const existingVersion = secret?.versions.find(version => version.versionName === versionName);
            if (existingVersion) {
                return {
                    status: false,
                    message: `Version '${versionName}' already exists.`,
                    versions: secret?.versions
                };
            }

            await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName },
                {
                    $push: {
                        versions: {
                            $each: [{ versionName, value }],
                            $position: 0 // This will insert the new version at the start of the array
                        }
                    },
                    $currentDate: { lastAccessAt: true, updatedAt: true }
                } as any
            );

            secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName }) as Secret;

            return {
                status: true,
                message: `Version '${versionName}' added.`,
                versions: secret.versions
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

            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName }) as Secret;
            return { status: true, message: `Version '${versionName}' updated successfully.`, versions: secret.versions };
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

    // Deletes the most recent version of a secret
    rollback: async (params: RollBackVersionParams): Promise<VersionOperationResponse> => {
        const { dbClient, projectName, serviceName, secretName } = params;
        try {
            const secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName });
            if (!secret || secret.versions.length === 0) {
                return { status: false, message: `No versions found for secret '${secretName}'.` };
            }

            // Assuming the last item in the versions array is the most recent
            const latestVersion = secret.versions.shift(); // Removes and returns the last item

            await dbClient.db(projectName).collection(serviceName).updateOne(
                { secretName },
                { $set: { versions: secret.versions } } // Updates the document with the version removed
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
