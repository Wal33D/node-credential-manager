import { MongoClient, ObjectId } from "mongodb";

export interface SecretVersionResponse {
    status: boolean;
    projectName: string;
    serviceName: string;
    message: string;
    secret?: Secret | null;
    version?: string;
    newValue?: string;
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
    envType: 'production' | 'test' | 'development';
    credential: { version: string, value: string }[];
    updatedAt: Date;
    createdAt: Date;
    lastAccessAt: Date;
}

export const addSecretVersion = async ({ dbClient, projectName, serviceName, secretName, version, newValue }: AddSecretVersionParams):
    Promise<SecretVersionResponse> => {
    let status = false;
    let message = '';
    let secret: Secret | null = null;

    try {
        const filter = { secretName: secretName };
        const updateOperation = {
            $push: { credential: { version, value: newValue } },
            $currentDate: { lastAccessAt: true, updatedAt: true }
        } as any;

        const result = await dbClient.db(projectName).collection(serviceName).updateOne(filter, updateOperation);

        if (result.matchedCount === 1) {
            status = true;
            secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>(filter);
            message = `Version '${version}' added to secret '${secretName}' in service '${serviceName}'.`;
        } else {
            message = `Secret '${secretName}' not found in service '${serviceName}'.`;
        }
    } catch (error) {
        console.error("Error adding/updating secret version:", error);
        message = "An error occurred while adding/updating the secret version.";
    }

    return { status, message, projectName, serviceName, secret, version, newValue };
};

export const updateSecretVersion = async ({ dbClient, projectName, serviceName, secretName, version, newValue }: AddSecretVersionParams):
    Promise<SecretVersionResponse> => {
    let status = false;
    let message = '';

    try {
        const filter = { secretName: secretName };
        const update = {
            $set: { [`credential.$[elem].value`]: newValue },
        };
        const arrayFilters = [{ "elem.version": version }];

        const result = await dbClient.db(projectName).collection(serviceName).updateOne(filter, update, { arrayFilters });

        if (result.modifiedCount === 1) {
            status = true;
            message = `Updated version '${version}' for secret '${secretName}' in service '${serviceName}'.`;
        } else {
            message = "No secret matched the filter, or no changes were needed.";
        }
    } catch (error) {
        console.error("Error updating secret version:", error);
        message = "An error occurred while updating the secret.";
    }

    return { status, message, projectName, serviceName, version, newValue };
};
