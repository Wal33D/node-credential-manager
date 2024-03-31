import { Db } from "mongodb";

export const findServiceByName = async ({ serviceName, dbConnection }: { serviceName: string, dbConnection: Db | any }) => {
    let status = false;
    let keyType = '';
    let message = '';

    try {
        if (!dbConnection) {
            throw new Error('Database connection is not initialized.');
        }

        const dbCollection = dbConnection.collection('apiKeys');
        const document = await dbCollection.findOne({}); // Fetch the single document

        if (document && document.services) {
            // First, try to find a case-sensitive match
            const exactMatchService = document.services.find((service: { name: string; }) => service.name === serviceName);

            // If no case-sensitive match, try to find a case-insensitive match to suggest the correct casing
            if (!exactMatchService) {
                const caseInsensitiveMatchService = document.services.find((service: { name: string; }) => service.name.toLowerCase() === serviceName.toLowerCase());

                if (caseInsensitiveMatchService) {
                    message = `Did you mean this service '${caseInsensitiveMatchService.name}'? Service name is case-sensitive.`;
                } else {
                    message = `Service ${serviceName} not found.`;
                }
            } else {
                status = true;
                keyType = exactMatchService.keys;
                serviceName = exactMatchService.name;
                message = `Keys for service ${exactMatchService.name} retrieved successfully.`;
            }
        } else {
            throw new Error('No services found in the database.');
        }
    } catch (error: any) {
        message = `Error: ${error.message}`;
    }

    return { status, keyType, serviceName, message };
};
