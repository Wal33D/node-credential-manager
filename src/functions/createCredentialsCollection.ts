import { Db } from 'mongodb';

export async function createCredentialsCollection(dbConnection: Db, collectionName: string): Promise<{ status: boolean; message: string; }> {
    let status = false;
    let message = '';

    if (!dbConnection) {
        status = false
        message = 'Database connection is not initialized.'
    }

    try {
        const collections = await dbConnection.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
        if (collections.length === 0) {
            await dbConnection.createCollection(collectionName);
            message = `INFO: Collection '${collectionName}' was created as it did not exist.`
            status = true;
        } else {
            message = `INFO: Collection '${collectionName}' already exists, no action required.`
            status = true;
        }
    } catch (error) {
        message = `Failed to create or verify the '${collectionName}' collection: ${error}`
        status = false;
    }
    return { status, message };
}
