import { Db } from 'mongodb';

export async function createOrUpdateKey({
    dbConnection,
    cabinetName,
    keyId,
    keyData,
    defaultCabinetName
}: {
    dbConnection: Db,
    cabinetName: string,
    keyId: string,
    keyData: object,
    defaultCabinetName: string
}): Promise<{ status: boolean; keyId: string; operationStatus: boolean; message: string }> {
    let status = false;
    let operationStatus = false; // True if inserted or updated, false otherwise
    let message = '';

    try {
        const finalCabinetName = cabinetName || defaultCabinetName;
        const cabinet = dbConnection.collection(finalCabinetName);

        // Check if the Key already exists
        const existingKey = await cabinet.findOne({ keyId: keyId });
        if (existingKey) {
            // Update the existing Key with new data
            await cabinet.updateOne({ keyId: keyId }, { $set: keyData });
            message = `Key '${keyId}' in cabinet '${finalCabinetName}' was updated successfully.`;
            operationStatus = true;
        } else {
            // Insert a new Key document
            await cabinet.insertOne({ keyId: keyId, ...keyData });
            message = `Key '${keyId}' was inserted into cabinet '${finalCabinetName}'.`;
            operationStatus = true;
        }

        status = true; // Operation was successful
    } catch (error: any) {
        message = `Failed to insert or update Key: ${error.message}`;
    }

    return { status, keyId, operationStatus, message };
}
