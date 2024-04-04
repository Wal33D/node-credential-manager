import { MongoClient } from "mongodb";
import { dbProjectOperationResponse } from "./types";

export const getProjectConnection = (dbClient: MongoClient, projectName: string): any => ({
    status: true, message: `Project '${projectName}' accessed successfully.`, project: dbClient.db(projectName),
});

export const projectExists = async (dbClient: MongoClient, projectName: string): Promise<dbProjectOperationResponse> => {
    try {
        const projects = await dbClient.db().admin().listDatabases();
        const exists = projects.databases.some(project => project.name === projectName);
        return { status: true, message: exists ? `Project '${projectName}' exists.` : `Project '${projectName}' does not exist.`, projectName };
    } catch (error:any) {
        return { status: false, message: error.message, projectName };
    }
};

export const listAllProjects = async (dbClient: MongoClient): Promise<dbProjectOperationResponse> => {
    try {
        const projects = await dbClient.db().admin().listDatabases();
        return { status: true, message: "Successfully retrieved project list.", projects: projects.databases.map(project => project.name) };
    } catch (error:any) {
        return { status: false, message: error.message };
    }
};

export const createProject = async (dbClient: MongoClient, projectName: string, serviceName: string): Promise<dbProjectOperationResponse> => {
    try {
        await dbClient.db(projectName).createCollection(serviceName);
        return { status: true, message: `Service '${serviceName}' created in project '${projectName}'.`, projectName, serviceName };
    } catch (error:any) {
        return { status: false, message: error.message, projectName, serviceName };
    }
};

export const deleteProject = async (dbClient: MongoClient, projectName: string): Promise<dbProjectOperationResponse> => {
    try {
        await dbClient.db(projectName).dropDatabase();
        return { status: true, message: `Project '${projectName}' dropped successfully.`, projectName };
    } catch (error:any) {
        return { status: false, message: error.message, projectName };
    }
};

export const copyProject = async (dbClient: MongoClient, sourceProjectName: string, targetProjectName: string): Promise<dbProjectOperationResponse> => {
    try {
        const sourceProject = dbClient.db(sourceProjectName);
        const targetProject = dbClient.db(targetProjectName);
        const services = await sourceProject.listCollections().toArray();
        for (let service of services) {
            const docs = await sourceProject.collection(service.name).find({}).toArray();
            await targetProject.collection(service.name).insertMany(docs);
        }
        return { status: true, message: `Project '${sourceProjectName}' copied to '${targetProjectName}'.` };
    } catch (error:any) {
        return { status: false, message: error.message };
    }
};
