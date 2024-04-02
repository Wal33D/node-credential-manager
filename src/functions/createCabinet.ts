import { Db } from 'mongodb';
const DEFAULT_COLLECTION_NAME = process.env.DEFAULT_COLLECTION_NAME || "CredentialManager";

export async function createCabinet({
    dbConnection,
    collectionName,
    newCollectionName,
}: {
    dbConnection: Db,
    collectionName: string,
    newCollectionName?: string,
}): Promise<{ status: boolean; collectionName: string; creationStatus: boolean; message: string }> {
    let status = false;
    let creationStatus = false;
    let message = '';

    try {
        const finalCollectionName = newCollectionName ?? DEFAULT_COLLECTION_NAME;
        const wasAlreadySet = collectionName === finalCollectionName;
        console.log(finalCollectionName)

        if (!wasAlreadySet) {
            const dbCollection = await dbConnection.listCollections({ name: finalCollectionName }, { nameOnly: true }).toArray();
            if (dbCollection.length === 0) {
                await dbConnection.createCollection(finalCollectionName);
                creationStatus = true;
                message = `Collection '${finalCollectionName}' was created as it did not exist.`;
            } else {
                message = `Collection '${finalCollectionName}' already exists, no action required.`;
            }

            collectionName = finalCollectionName;
            status = true;
        } else {
            message = `Collection name is already '${finalCollectionName}'. No changes were made.`;
            status = false;
        }
    } catch (error: any) {
        message = `Failed to create/switch collection: ${error.message}`;
    }

    return { status, creationStatus, collectionName, message };
}
