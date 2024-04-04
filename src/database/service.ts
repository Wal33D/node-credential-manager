import { MongoClient, ObjectId } from "mongodb";

export interface dbSecretOperationResponse {
    status: boolean;
    message: string;
    projectName: string;
    serviceName: string;
    secretName?: string;
    filter?: object;
    secret?: Secret;
    version?: any;
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

interface AddSecretVersion {
    status: boolean;
    message: string;
    projectName: string;
    serviceName: string;
    secret?: Secret | null;
}

export const addSecretVersion = async ({ dbClient, projectName, serviceName, secretName, version, newValue }: AddSecretVersionParams):
    Promise<AddSecretVersion> => {
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
            message = `Version '${version}' added to secret '${secretName}' in service '${serviceName}'.`;
            secret = await dbClient.db(projectName).collection(serviceName).findOne<Secret>(filter) as Secret;
        } else {
            message = `Secret '${secretName}' not found in service '${serviceName}'.`;
        }
    } catch (error) {
        console.error("Error adding/updating secret version:", error);
        message = "An error occurred while adding/updating the secret version.";
    }

    return { status, message, projectName, serviceName, secret };
};

export const updateSecretInService = async ({ dbClient, projectName, serviceName, secretName, version, newValue }: AddSecretVersionParams):
 Promise<any> => {
    try {
        const filter = { SecretName: secretName };
        const update = {
            $set: { [`values.${version}.value`]: newValue },
        };
        const result = await dbClient.db(projectName).collection(serviceName).updateOne(filter, update);

        return { status: result.modifiedCount === 1, message: result.modifiedCount === 1 ? `Updated secret '${secretName}' in '${serviceName}'.` : "No secret matched the filter, or no changes were needed.", projectName, serviceName, secretName, version, newValue, };
    } catch (error) {
        return { status: false, message: "An error occurred while updating the secret.", projectName, serviceName, };
    }
};
