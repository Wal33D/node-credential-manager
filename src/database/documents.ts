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
export interface UpdateResult {
    matchedCount?: number;
    modifiedCount?: number;
    upsertedCount?: number;
    newValue?: any;
}

export interface DeleteResult {
    deletedCount: number;
}

export interface Secret {
    _id: ObjectId;
    secretName: string;
    envName: string;
    envType: 'production' | 'test' | 'development';
    credential: [{ version: string, value: string }];
    updatedAt: Date;
    createdAt: Date;
    lastAccessAt: Date;
}


// Delete secrets from a collection
export const deleteSecretsFromService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object
): Promise<dbSecretOperationResponse & DeleteResult> => {
    const result: DeleteResult = await dbClient.db(projectName).collection(serviceName).deleteMany(filter);
    return {
        status: true, message: `Deleted ${result.deletedCount} secrets from '${serviceName}'.`, projectName, serviceName, filter, ...result
    };
};

// Delete an individual secret from a collection
export const deleteSecretFromService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object
): Promise<dbSecretOperationResponse & DeleteResult> => {
    const result: DeleteResult = await dbClient.db(projectName).collection(serviceName).deleteOne(filter);
    return {
        status: result.deletedCount === 1, message: result.deletedCount === 1 ? `Deleted a secret from '${serviceName}'.` : `No secrets matched the filter to delete.`, projectName, serviceName, filter, ...result
    };
};

// Count secrets in a collection
export const countSecretsInService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object = {}
): Promise<dbSecretOperationResponse & { count: number }> => {
    const count = await dbClient.db(projectName).collection(serviceName).countDocuments(filter);
    return {
        status: true, message: `Counted ${count} secrets in '${serviceName}'.`, projectName, serviceName, filter, count
    };
};

// Get all secrets from a collection
export const getAllSecretsFromService = async (
    dbClient: MongoClient, projectName: string, serviceName: string
): Promise<dbSecretOperationResponse & { secrets: Secret[] }> => {
    const secrets = await dbClient.db(projectName).collection(serviceName).find({}).toArray() as Secret[];
    return {
        status: true, message: "Successfully retrieved all secrets.", projectName, serviceName, secrets
    };
};

// Find secrets in a collection
export const findSecretsInService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, filter: object = {}
): Promise<dbSecretOperationResponse & { secrets: Secret[] }> => {
    const secrets: Secret[] = await dbClient.db(projectName).collection(serviceName).find(filter).toArray() as Secret[];
    return {
        status: true, message: `Found secrets in '${serviceName}'.`, projectName, serviceName, filter, secrets
    };
};

// Aggregate secrets in a collection
export const aggregateSecretsInService = async (
    dbClient: MongoClient, projectName: string, serviceName: string, pipeline: object[]
): Promise<dbSecretOperationResponse & { secrets: Secret[] }> => {
    const secrets: Secret[] = await dbClient.db(projectName).collection(serviceName).aggregate(pipeline).toArray() as Secret[];;
    return {
        status: true, message: `Aggregated secrets in '${serviceName}'.`, projectName, serviceName, secrets
    };
};

// Find a secret by name
export const findSecretByName = async (
    { dbClient, projectName, serviceName, secretName }: { dbClient: MongoClient; projectName: string; serviceName: string; secretName: string; }
): Promise<dbSecretOperationResponse & { secret?: Secret }> => {
    const secret: Secret | null = await dbClient.db(projectName).collection(serviceName).findOne({ SecretName: secretName }) as Secret;
    return {
        status: !!secret, message: secret ? `Secret with name '${secretName}' found successfully.` : `Secret with name '${secretName}' not found in '${serviceName}'.`, projectName, serviceName, secret
    };
};

export const findSecretValueByVersion = async (
    dbClient: MongoClient,
    projectName: string,
    serviceName: string,
    secretName: string,
    version: string = "latest"
): Promise<dbSecretOperationResponse & { secretValue?: { version: string, value: string } }> => {
    try {
        const db = dbClient.db(projectName);
        const secret: Secret | null = await db.collection(serviceName).findOne({ secretName: secretName }) as Secret;

        if (!secret) {
            return { status: false, message: `Secret with name '${secretName}' not found.`, projectName, serviceName };
        }

        let secretValue: { version: string, value: string } | undefined;

        if (version === "latest") {
            // Assumes the latest version is the last in the array
            secretValue = secret.credential[secret.credential.length - 1];
        } else {
            // Find the specific version in the credential array
            secretValue = secret.credential.find(cred => cred.version === version);
        }

        if (!secretValue) {
            return { status: false, message: `Version '${version}' not found for secret '${secretName}'.`, projectName, serviceName };
        }

        return { status: true, message: `Found version '${version}' for secret '${secretName}'.`, projectName, serviceName, secretValue };
    } catch (error) {
        console.error("Error finding secret value by version:", error);
        return { status: false, message: "An error occurred while finding the secret value.", projectName, serviceName };
    }
};

export const addSecret = async (
    dbClient: MongoClient,
    projectName: string,
    serviceName: string,
    secretName: string,
    envName: string,
    envType: 'production' | 'test' | 'development',
    credentials: { version: string, value: string }[]
): Promise<dbSecretOperationResponse> => {
    try {
        const secretData: Secret = {
            secretName: secretName,
            envName: envName,
            envType: envType,
            credential: credentials as any,
            updatedAt: new Date(),
            createdAt: new Date(),
            lastAccessAt: new Date(),
            _id: new ObjectId()
        };

        const result = await dbClient.db(projectName).collection(serviceName).insertOne(secretData);

        if (result.insertedId) {
            return {
                status: true,
                message: `Secret '${secretName}' added successfully to service '${serviceName}' in project '${projectName}'. New secret ID: ${result.insertedId}.`,
                projectName,
                serviceName,
                secret: { ...secretData, _id: result.insertedId },
            };
        } else {
            return {
                status: false,
                message: `Failed to add the secret '${secretName}'.`,
                projectName,
                serviceName,
            };
        }
    } catch (error) {
        console.error("Error adding secret:", error);
        return {
            status: false,
            message: "An error occurred while adding the secret.",
            projectName,
            serviceName,
        };
    }
};
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

interface AddSecretVersionResponse {
    status: boolean;
    message: string;
    projectName: string;
    serviceName: string;
    secret?: Secret|null;
}

export const addSecretVersion = async ({ dbClient, projectName, serviceName, secretName, version, newValue }: AddSecretVersionParams):
    Promise<AddSecretVersionResponse> => {
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
            // Retrieve the updated secret
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

export const updateSecretInService = async (dbClient: MongoClient, projectName: string, serviceName: string, secretName: string, version: string, newValue: any): Promise<dbSecretOperationResponse & UpdateResult> => {
    try {
        const filter = { SecretName: secretName };
        const update = {
            $set: { [`values.${version}.value`]: newValue },
        };
        const result: UpdateResult = await dbClient.db(projectName).collection(serviceName).updateOne(filter, update);

        return { status: result.modifiedCount === 1, message: result.modifiedCount === 1 ? `Updated secret '${secretName}' in '${serviceName}'.` : "No secret matched the filter, or no changes were needed.", projectName, serviceName, secretName, version, newValue, };
    } catch (error) {
        return { status: false, message: "An error occurred while updating the secret.", projectName, serviceName, };
    }
};
