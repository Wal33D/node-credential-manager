import { Db } from "mongodb";
const collectionName = 'CredentialManager';

export const findServiceByName = async ({ serviceName, dbConnection }: { serviceName: string, dbConnection: Db }): Promise<{ status: boolean; serviceName: string; credentials: any[]; message: string; }> => {
    let status = false;
    let credentials = [];
    let message = '';

    try {
        if (!dbConnection) {
            throw new Error('Database connection is not initialized.');
        }

        const dbCollection = dbConnection.collection(collectionName);
        const serviceDocument = await dbCollection.findOne({ name: serviceName });

        if (!serviceDocument) {
            const caseInsensitiveService = await dbCollection.findOne({
                name: { $regex: new RegExp("^" + serviceName + "$", "i") }
            });

            if (caseInsensitiveService) {
                message = `Service '${serviceName}' not found.\n - Hint: Did you mean '${caseInsensitiveService.name}'? Service name is case-sensitive.\n`;
            } else {
                message = `Service '${serviceName}' not found.`;
            }
        } else {
            status = true;
            credentials = serviceDocument.credentials; 
            serviceName = serviceDocument.name; 
            message = `Credentials for service '${serviceDocument.name}' retrieved successfully.`;
        }
    } catch (error: any) {
        message = `Error: ${error.message}`;
    }

    return { status, serviceName, credentials, message };
};
