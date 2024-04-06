import { Db } from "mongodb";
import { Project, ProjectOperationParams, ProjectOperationResponse } from "./databaseTypes";

const projects = {
    getConnection: (params: ProjectOperationParams): Db => {
        const { dbClient, projectName } = params;
        return dbClient.db(projectName);
    },
    exists: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
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
    list: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient } = params;
        try {
            const projectsList = await dbClient.db().admin().listDatabases();
            const projects = projectsList.databases as Project[];
            return { status: true, message: "Successfully retrieved project list.", projects:projects };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },
    create: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient, projectName, serviceName } = params as any;
    
        try {
            const projectDb = dbClient.db(projectName);
    
            // Check if the collection already exists
            const collections = await projectDb.listCollections({}, { nameOnly: true }).toArray();
            const collectionExists = collections.some((collection: { name: any; }) => collection.name === serviceName);
    
            if (collectionExists) {
                // If the collection exists, return with a status of false
                return { 
                    status: false, 
                    message: `Service '${serviceName}' already exists in project '${projectName}'. No action performed.` 
                };
            }
    
            // If the collection does not exist, proceed to create it
            await projectDb.createCollection(serviceName);
    
            const appMetadataCollection = projectDb.collection('_app_metadata');
            await appMetadataCollection.updateOne(
                { projectName: projectName },
                {
                    $setOnInsert: { createdAt: new Date(), createdBy: "system" },
                    $set: { updatedAt: new Date(), projectName: projectName }
                },
                { upsert: true }
            );
    
            return {
                status: true,
                message: `Project '${projectName}' created with service '${serviceName}'. _app_metadata collection updated.`,
                project: projectDb as unknown as Project,
            };
        } catch (error: any) {
            return { status: false, message: `Failed to create project '${projectName}': ${error.message}` };
        }
    },
    
    delete: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient, projectName } = params;
        try {
            const operationResult = await dbClient.db(projectName).dropDatabase();
            return {
                status: true,
                message: `Project '${projectName}' dropped successfully.`,
                project: { name: projectName as string, services:[]} as Project,
            };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },
    copy: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient, projectName, targetProjectName } = params;
        try {
            const operationResults = [];
            const sourceProject = dbClient.db(projectName);
            const targetProject = dbClient.db(targetProjectName!);
            const services = await sourceProject.listCollections().toArray();
            for (let service of services) {
                const docs = await sourceProject.collection(service.name).find({}).toArray();
                if (docs.length > 0) {
                    const operationResult = await targetProject.collection(service.name).insertMany(docs);
                    operationResults.push(operationResult);
                } else {
                    console.log(`No documents to copy for collection: ${service.name}`);
                }
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
