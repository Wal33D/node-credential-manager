import { Db } from "mongodb";
const collectionName = 'testKeys';

export const findServiceByName = async ({ serviceNameKey, dbConnection }: { serviceNameKey: string, dbConnection: Db | any }):
    Promise<{
        status: boolean;
        serviceNameKey: string;
        credentials: any[];
        message: string;
    }> => {
    let status = false;
    let credentials = [];
    let message = '';

    try {
        if (!dbConnection) {
            throw new Error('Database connection is not initialized.');
        }

        const dbCollection = dbConnection.collection(collectionName);
        // Adjusted to directly query the service by name, considering each document represents a service now
        const serviceDocument = await dbCollection.findOne({ name: serviceNameKey });

        if (serviceDocument) {
            status = true;
            credentials = serviceDocument.credentials; // Updated field name
            message = `Credentials for service ${serviceDocument.name} retrieved successfully.`;
        } else {
            // If service not found, providing an adjusted message
            message = `Service ${serviceNameKey} not found.`;
        }
    } catch (error: any) {
        message = `Error: ${error.message}`;
    }

    return { status, serviceNameKey, credentials, message };
};
