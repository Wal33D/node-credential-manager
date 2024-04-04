import { MongoClient, ObjectId } from "mongodb";

type EnvType = 'production' | 'test' | 'development';

interface Credential {
    version: string;
    value: string;
}

export interface SecretVersionResponse {
    status: boolean;
    projectName: string;
    serviceName: string;
    message: string;
    secret?: Secret | null;
    credential?: Credential;
}

interface AddSecretVersionParams {
    dbClient: MongoClient;
    projectName: string;
    serviceName: string;
    secretName: string;
    version: string;
    newValue: string;
}

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

export const addSecretVersion = async ({
    dbClient, projectName, serviceName, secretName, version, newValue
}: AddSecretVersionParams): Promise<SecretVersionResponse> => {
    let status = false;
    let message = '';
    let secret: Secret | null = null;

    try {
        // First, find the secret to check if the version already exists
        secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName: secretName });

        if (!secret) {
            message = `Secret '${secretName}' not found in service '${serviceName}'.`;
            return { status, message, projectName, serviceName };
        }

        // Check if the version already exists in the credentials
        if (secret.credential.some(cred => cred.version === version)) {
            message = `Credential version '${version}' already exists for secret '${secretName}' in service '${serviceName}'. No new credential was added.`;
            return { status, message, projectName, serviceName, secret };
        }

        // If the version does not exist, proceed to add the new credential
        const updateOperation = {
            $push: { credential: { version, value: newValue } },
            $currentDate: { lastAccessAt: true, updatedAt: true }
        } as any;

        const result = await dbClient.db(projectName).collection(serviceName).updateOne({ secretName: secretName }, updateOperation);

        if (result.modifiedCount === 1) {
            // Refetch the secret to get the updated document
            secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>({ secretName: secretName });
            status = true;
            message = `Version '${version}' added to secret '${secretName}' in service '${serviceName}'.`;
        } else {
            message = `Failed to add version '${version}' to secret '${secretName}'.`;
        }
    } catch (error) {
        console.error("Error adding/updating secret version:", error);
        message = "An error occurred while adding/updating the secret version.";
    }

    const credential: Credential = { version, value: newValue };
    return { status, message, projectName, serviceName, secret, credential };
};

export const updateSecretVersion = async ({
    dbClient, projectName, serviceName, secretName, version, newValue
}: AddSecretVersionParams): Promise<SecretVersionResponse> => {
    let status = false;
    let message = '';
    let secret: Secret | null = null;

    try {
        const filter = { secretName: secretName }; 
        const update = {
            $set: { "credential.$[elem].value": newValue },
        };
        const arrayFilters = [{ "elem.version": version }];

        const result = await dbClient.db(projectName).collection(serviceName).updateOne(filter, update, { arrayFilters });

        if (result.modifiedCount === 1) {
            secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>(filter);
            if (secret) {
                status = true;
                message = `Updated version '${version}' for secret '${secretName}' in service '${serviceName}'.`;
            } else {
                message = "Secret updated but not found afterwards.";
            }
        } else {
            message = "No secret matched the filter, or no changes were needed.";
        }
    } catch (error) {
        console.error("Error updating secret version:", error);
        message = "An error occurred while updating the secret.";
    }

    const credential: Credential = { version, value: newValue };

    return { status, message, projectName, serviceName, secret, credential };
};

