import { Db } from "mongodb";

export const deleteCabinet = async ({ dbConnection, collectionName, }:
    { dbConnection: Db; collectionName: string; }): Promise<{ status: boolean; message: string }> => {
    try {
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
