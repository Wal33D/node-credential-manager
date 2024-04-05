import { Db, MongoClient } from "mongodb";
import { Project, ProjectOperationParams, ProjectOperationResponse } from "./types";

const getProjectMetadata = async (dbClient: MongoClient, projectName: string): Promise<Project['metadata']> => {
    const stats = await dbClient.db(projectName).stats();
    const collections = await dbClient.db(projectName).listCollections().toArray();
    return {
        sizeOnDisk: stats.sizeOnDisk,
        empty: stats.empty,
        collectionsCount: collections.length,
    };
};

const projects = {
    getProjectConnection: (params: ProjectOperationParams): Db => {
        const { dbClient, projectName } = params;
        return dbClient.db(projectName);
    },

    projectExists: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient, projectName } = params;
        try {
            const projectsList = await dbClient.db().admin().listDatabases();
            const exists = projectsList.databases.some(project => project.name === projectName);
            return {
                status: true,
                message: exists ? `Project '${projectName}' exists.` : `Project '${projectName}' does not exist.`,
                project: exists ? { name: projectName } as any : null,
            };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },

    listAllProjects: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient } = params;
        try {
            const projectsList = await dbClient.db().admin().listDatabases();
            const projects = projectsList.databases.map(project => ({ name: project.name }));
            return { status: true, message: "Successfully retrieved project list.", projects };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },

    createProject: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient, projectName, serviceName } = params;
        try {
            const operationResult = await dbClient.db(projectName).createCollection(serviceName!);
            const metadata = await getProjectMetadata(dbClient, projectName as string);
            return {
                status: true,
                message: `Service '${serviceName}' created in project '${projectName}'.`,
                project: { name: projectName as string, services: [serviceName!], metadata },
            };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },

    deleteProject: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient, projectName } = params;
        try {
            const operationResult = await dbClient.db(projectName).dropDatabase();
            return {
                status: true,
                message: `Project '${projectName}' dropped successfully.`,
                project: { name: projectName as string },
            };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },

    copyProject: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient, projectName, targetProjectName } = params;
        try {
            const operationResults = [];
            const sourceProject = dbClient.db(projectName);
            const targetProject = dbClient.db(targetProjectName!);
            const services = await sourceProject.listCollections().toArray();
            for (let service of services) {
                const docs = await sourceProject.collection(service.name).find({}).toArray();
                const operationResult = await targetProject.collection(service.name).insertMany(docs);
                operationResults.push(operationResult); // Store each operation's result
            }
            return {
                status: true,
                message: `Project '${projectName}' copied to '${targetProjectName}'.`,
                project: { name: targetProjectName! },
            };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },
};

export { projects };
