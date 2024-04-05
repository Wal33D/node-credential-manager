import { MongoClient, ObjectId } from "mongodb";

type EnvType = 'production' | 'test' | 'development';

interface Credential {
    version: string;
    value: string;
}

export interface SecretVersionResponse {
    status: boolean;
    message: string;
    secret?: Secret | null;
    credential?: Credential;
}

interface VersionOperationParams {
    dbClient: MongoClient;
    projectName: string;
    serviceName: string;
    secretName: string;
    version: string;
    value: string;
}


interface AddVersionParams extends VersionOperationParams { }

interface UpdateVersionParams extends VersionOperationParams { }

interface LatestVersionParams extends VersionOperationParams { }

interface Secret {
    _id: ObjectId;
    secretName: string;
    envName: string;
    envType: EnvType;
    credential: Credential[];
    updatedAt: Date;
    createdAt: Date;
    lastAccessAt: Date;
}

const version = {
    // Adds a version to a secret if it doesn't already exist.
    add: async (params: AddVersionParams): Promise<SecretVersionResponse> => {
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
            return {
                status: true,
                message: `Version '${version}' added.`,
                secret,
                credential: { version, value }
            };
        } catch (error: any) {
            console.error("Error adding/updating secret version:", error);
            return { status: false, message: error.message };
        }
    },

    // Updates an existing version of a secret.
    update: async (params: UpdateVersionParams): Promise<SecretVersionResponse> => {
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
            return {
                status: true,
                message: `Version '${version}' updated.`,
                secret,
                credential: { version, value }
            };
        } catch (error: any) {
            console.error("Error updating secret version:", error);
            return { status: false, message: error.message };
        }
    },

    // Finds and returns the latest credential entry of a secret.
    latest: async (params: LatestVersionParams): Promise<SecretVersionResponse> => {
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

            return {
                status: true,
                message: `Latest credential version '${sortedCredentials[0].version}' retrieved successfully.`,
                secret,
                credential: sortedCredentials[0]
            };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    }
};

export { version };
