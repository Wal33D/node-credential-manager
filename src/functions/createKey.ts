import { Db } from 'mongodb';

export async function createKey({
    dbConnection,
    cabinetName,
    recordName,
    keyData,
}: {
    dbConnection: Db,
    cabinetName: string,
    recordName: string,
    keyData: object,
}): Promise<{ status: boolean; recordId: string | null; operationStatus: boolean; message: string }> {
    let status = false;
    let operationStatus = false;
    let recordId = null;
    let message = '';

    try {
        const cabinet = dbConnection.collection(cabinetName);

        const existingKey = await cabinet.findOne({ name: recordName });
        if (existingKey) {
            // For updates, use the _id of the existing document
            await cabinet.updateOne({ name: recordName }, { $set: keyData });
            recordId = existingKey._id.toString(); // Convert ObjectId to string
            message = `Key '${recordName}' in cabinet '${cabinetName}' was updated successfully.`;
            operationStatus = true;
        } else {
            // For inserts, capture the _id from the insertion result
            const insertResult = await cabinet.insertOne({ name: recordName, ...keyData });
            recordId = insertResult.insertedId.toString(); // Convert ObjectId to string
            message = `Key '${recordName}' was inserted into cabinet '${cabinetName}'.`;
            operationStatus = true;
        }

        status = true;
    } catch (error: any) {
        message = `Failed to insert or update Key: ${error.message}`;
    }

    return { status, recordId, operationStatus, message };
}
