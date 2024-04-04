import { MongoClient } from "mongodb";
import { dbServiceOperationResponse } from "./types";

export const listServices = async (dbClient: MongoClient, projectName: string): Promise<dbServiceOperationResponse> => {
    try {
        const services = await dbClient.db(projectName).listCollections().toArray();
        return { status: true, message: "Services listed successfully.", projectName, services: services.map(s => s.name) };
    } catch (error: any) {
        return { status: false, message: error.message, projectName };
    }
};

export const addNewService = async (dbClient: MongoClient, projectName: string, serviceName: string): Promise<dbServiceOperationResponse> => {
    try {
        await dbClient.db(projectName).createCollection(serviceName);
        return { status: true, message: `Service '${serviceName}' added.`, projectName, serviceName };
    } catch (error: any) {
        return { status: false, message: error.message, projectName, serviceName };
    }
};

export const renameService = async (dbClient: MongoClient, projectName: string, oldServiceName: string, newServiceName: string): Promise<dbServiceOperationResponse> => {
    try {
        await dbClient.db(projectName).collection(oldServiceName).rename(newServiceName);
        return { status: true, message: `Service renamed from '${oldServiceName}' to '${newServiceName}'.`, projectName, serviceName: newServiceName };
    } catch (error: any) {
        return { status: false, message: error.message, projectName, serviceName: oldServiceName };
    }
};

export const removeService = async (dbClient: MongoClient, projectName: string, serviceName: string): Promise<dbServiceOperationResponse> => {
    try {
        await dbClient.db(projectName).dropCollection(serviceName);
        return { status: true, message: `Service '${serviceName}' removed.`, projectName, serviceName };
    } catch (error: any) {
        return { status: false, message: error.message, projectName, serviceName };
    }
};

export const serviceExists = async (dbClient: MongoClient, projectName: string, serviceName: string): Promise<dbServiceOperationResponse> => {
    try {
        const services = await dbClient.db(projectName).listCollections({ name: serviceName }, { nameOnly: true }).toArray();
        const exists = services.length > 0;
        return { status: true, message: exists ? `Service '${serviceName}' exists.` : `Service '${serviceName}' does not exist.`, projectName, serviceName, exists };
    } catch (error: any) {
        return { status: false, message: "An error occurred while checking if the service exists.", projectName, serviceName, exists: false };
    }
};
