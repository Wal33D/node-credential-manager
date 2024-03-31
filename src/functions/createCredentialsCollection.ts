import { Db } from 'mongodb';

export async function createCredentialsCollection(dbConnection: Db | null, collectionName: string): Promise<{ status: boolean; message: string; logMessage?: string }> {
    if (!dbConnection) {
        return { status: false, message: "Database connection is not initialized." };
    }

    try {
        const collections = await dbConnection.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
        if (collections.length === 0) {
            await dbConnection.createCollection(collectionName);
            return {
                status: true,
                message: `Collection '${collectionName}' created successfully.`,
                logMessage: `INFO: Collection '${collectionName}' was created as it did not exist.`
            };
        } else {
            return {
                status: true,
                message: `Collection '${collectionName}' already exists, no changes made.`,
                logMessage: `INFO: Collection '${collectionName}' already exists, no action required.`
            };
        }
    } catch (error) {
        console.error(`Failed to create or verify the '${collectionName}' collection: ${error}`);
        return { status: false, message: `Failed to create or verify the collection: ${error}` };
    }
}
