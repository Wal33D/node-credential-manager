import { Db } from 'mongodb';

interface RecordData {
    name: string;
    credential: string;
    created_at: Date;
    updated_at: Date;
    uid?: string; 
    description?: string
  }
  
/**
 * Inserts a record into the specified cabinet (collection).
 * 
 * @param {Object} params - The function parameters.
 * @param {Db} params.dbConnection - The MongoDB connection.
 * @param {string} params.cabinetName - The name of the cabinet (collection) where the record will be inserted.
 * @param {RecordData} params.recordData - The data for the record to be inserted, conforming to the RecordData interface.
 * @returns {Promise<Object>} The result object containing the status, insertedId, and a message.
 */

export async function insertRecordIntoCabinet({
    dbConnection,
    cabinetName,
    recordData,
}: {
    dbConnection: Db,
    cabinetName: string,
    recordData: RecordData,
}): Promise<{ status: boolean; recordId: string|null; message: string }> {
    try {
        const cabinet = dbConnection.collection(cabinetName);
        const result = await cabinet.insertOne(recordData);

        if (result.insertedId) {
            return {
                status: true,
                recordId: result.insertedId.toString(),
                message: `Record was successfully inserted into cabinet '${cabinetName}' with ID: ${result.insertedId}.`,
            };
        } else {
            return {
                status: false,
                recordId:null,
                message: "Failed to insert the record into the cabinet.",
            };
        }
    } catch (error: any) {
        return {
            status: false,
            recordId:null,
            message: `Failed to insert the record into the cabinet: ${error.message}`,
        };
    }
}
