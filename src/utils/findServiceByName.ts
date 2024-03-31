import { Db } from "mongodb";
const collectionName = 'testKeys';

export const findServiceByName = async ({ serviceName, dbConnection }: { serviceName: string, dbConnection: Db | any }):
    Promise<{
        status: boolean;
        serviceName: string;
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
        // Attempt a case-sensitive search first
        const serviceDocument = await dbCollection.findOne({ name: serviceName });

        if (!serviceDocument) {
            // If not found, attempt a case-insensitive search to provide a hint
            const caseInsensitiveService = await dbCollection.findOne({
                name: { $regex: new RegExp("^" + serviceName + "$", "i") }
            });

            if (caseInsensitiveService) {
                // Found a case-insensitive match; provide a hint
                message = `Service '${serviceName}' not found.\n - Hint: Did you mean '${caseInsensitiveService.name}'? Service name is case-sensitive.\n`;
            } else {
                // No case-insensitive match found either
                message = `Service '${serviceName}' not found.`;
            }
        } else {
            // Found a case-sensitive match; proceed normally
            status = true;
            credentials = serviceDocument.credentials; // Assume the updated structure
            serviceName = serviceDocument.name; // This line might be redundant if serviceName is not meant to be mutated
            message = `Credentials for service '${serviceDocument.name}' retrieved successfully.`;
        }
    } catch (error: any) {
        message = `Error: ${error.message}`;
    }

    return { status, serviceName, credentials, message };
};
