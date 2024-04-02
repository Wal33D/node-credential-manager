import { Db } from "mongodb";

const DEFAULT_COLLECTION_NAME = process.env.DEFAULT_COLLECTION_NAME || "CredentialManager";

export const deleteCabinet = async ({ dbConnection, collectionName, }:
    { dbConnection: Db; collectionName: string; }): Promise<{ status: boolean; message: string }> => {
    try {
        if (collectionName === DEFAULT_COLLECTION_NAME) {
            return { status: false, message: "Deleting the default collection is not permitted." };
        }

        const collectionExists = await dbConnection.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
        if (collectionExists.length === 0) {
            return { status: false, message: `Collection '${collectionName}' does not exist, no action required.` };
        }

        await dbConnection.collection(collectionName).drop();
        return { status: true, message: `Collection '${collectionName}' was successfully deleted.` };
    } catch (error: any) {
        return { status: false, message: `Failed to delete the '${collectionName}' collection: ${error.message}` };
    }
};
