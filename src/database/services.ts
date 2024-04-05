import { ServiceOperationParams, ServiceOperationResponse } from "./types";

const services = {
    list: async ({ dbClient, projectName }: ServiceOperationParams): Promise<ServiceOperationResponse> => {
        try {
            const services = await dbClient.db(projectName).listCollections().toArray();
            return { status: true, message: "Services listed successfully.", projectName, services: services.map(s => s.name) };
        } catch (error: any) {
            return { status: false, message: error.message, projectName };
        } 
    },

    add: async ({ dbClient, projectName, serviceName }: ServiceOperationParams): Promise<ServiceOperationResponse> => {
        if (!serviceName) throw new Error("Service name is required.");
        try {
            await dbClient.db(projectName).createCollection(serviceName);
            return { status: true, message: `Service '${serviceName}' added.`, projectName, serviceName };
        } catch (error: any) {
            return { status: false, message: error.message, projectName, serviceName };
        }
    },

    rename: async ({ dbClient, projectName, serviceName, newServiceName }: ServiceOperationParams): Promise<ServiceOperationResponse> => {
        if (!serviceName || !newServiceName) throw new Error("Both old and new service names are required.");
        try {
            await dbClient.db(projectName).collection(serviceName).rename(newServiceName);
            return { status: true, message: `Service renamed from '${serviceName}' to '${newServiceName}'.`, projectName, serviceName: newServiceName };
        } catch (error: any) {
            return { status: false, message: error.message, projectName, serviceName: serviceName };
        }
    },

    remove: async ({ dbClient, projectName, serviceName }: ServiceOperationParams): Promise<ServiceOperationResponse> => {
        if (!serviceName) throw new Error("Service name is required.");
        try {
            await dbClient.db(projectName).dropCollection(serviceName);
            return { status: true, message: `Service '${serviceName}' removed.`, projectName, serviceName };
        } catch (error: any) {
            return { status: false, message: error.message, projectName, serviceName };
        }
    },

    exists: async ({ dbClient, projectName, serviceName }: ServiceOperationParams): Promise<ServiceOperationResponse> => {
        if (!serviceName) throw new Error("Service name is required.");
        try {
            const services = await dbClient.db(projectName).listCollections({ name: serviceName }, { nameOnly: true }).toArray();
            const exists = services.length > 0;
            return { status: true, message: exists ? `Service '${serviceName}' exists.` : `Service '${serviceName}' does not exist.`, projectName, serviceName, exists };
        } catch (error: any) {
            return { status: false, message: "An error occurred while checking if the service exists.", projectName, serviceName, exists: false };
        }
    }
};

export { services };
