import { Db } from "mongodb";

export const findServiceByName = async ({ serviceName, dbConnection }: { serviceName: string, dbConnection: Db| any }) => {
    let status = false;
    let result = null;
    let message = '';

    try {
        if (!dbConnection) {
            throw new Error('Database connection is not initialized.');
        }

        const dbCollection = dbConnection.collection('apiKeys');
        const document = await dbCollection.findOne({}); // Fetch the single document

        if (document && document.services) {
            const service = document.services.find((service: { name: string; }) => service.name.toLowerCase() === serviceName.toLowerCase());

            if (service) {
                if (service.name !== serviceName) {
                    console.error(`Did you mean this service '${service.name}'?`);
                }
                status = true;
                result = service.keys;
                message = `Keys for service ${serviceName} retrieved successfully.`;
            } else {
                throw new Error(`Service ${serviceName} not found.`);
            }
        } else {
            throw new Error('No services found in the database.');
        }
    } catch (error:any) {
        message = `Error: ${error.message}`;
    }

    return { status, result, message };
};
