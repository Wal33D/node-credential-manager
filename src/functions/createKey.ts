import { Db } from 'mongodb';

export async function createKey({
    dbConnection,
    cabinetName,
    keyId,
    keyData,
}: {
    dbConnection: Db,
    cabinetName: string,
    keyId: string,
    keyData: object,
}): Promise<{ status: boolean; keyId: string; operationStatus: boolean; message: string }> {
    let status = false;
    let operationStatus = false;
    let message = '';

    try {
        const cabinet = dbConnection.collection(cabinetName);

        const existingKey = await cabinet.findOne({ keyId: keyId });
        if (existingKey) {
            await cabinet.updateOne({ keyId: keyId }, { $set: keyData });
            message = `Key '${keyId}' in cabinet '${cabinetName}' was updated successfully.`;
            operationStatus = true;
        } else {
            await cabinet.insertOne({ keyId: keyId, ...keyData });
            message = `Key '${keyId}' was inserted into cabinet '${cabinetName}'.`;
            operationStatus = true;
        }

        status = true; 
    } catch (error: any) {
        message = `Failed to insert or update Key: ${error.message}`;
    }

    return { status, keyId, operationStatus, message };
}
