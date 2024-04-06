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
            const filteredProjects = projectsList.databases.filter(project => project.name !== 'admin' && project.name !== 'local') as Project[];

            const exists = filteredProjects.some(project => project.name === projectName);
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
            const filteredProjects = projectsList.databases.filter(project => project.name !== 'admin' && project.name !== 'local') as Project[];
            return { status: true, message: "Successfully retrieved project list.", projects: filteredProjects };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },
    create: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient, projectName, serviceName } = params;
        try {
            if (!projectName) {
                return {
                    status: false,
                    message: `Creating projects with the name '${projectName}' is not allowed.`
                };
            }
            if (projectName.toLowerCase() === 'admin' || projectName.toLowerCase() === 'local') {
                return {
                    status: false,
                    message: `Creating projects with the name '${projectName}' is not allowed.`
                };
            }
            const databasesList = await dbClient.db().admin().listDatabases();
            const databaseExists = databasesList.databases.some(db => db.name === projectName);
    
            if (databaseExists) {
                return {
                    status: false,
                    message: `Project '${projectName}' already exists. No action taken.`
                };
            }
    
            const project = await dbClient.db(projectName);
            await project.createCollection(serviceName!);
            const appMetadataCollection = dbClient.db(projectName).collection('_app_metadata');
            await appMetadataCollection.updateOne(
                { projectName: projectName },
                {
                    $setOnInsert: { createdAt: new Date(), createdBy: "system" },
                    $set: { updatedAt: new Date(), projectName: projectName }
                },
                { upsert: true }
            );
            const collections = await dbClient.db(projectName).listCollections().toArray();
            const services = collections
                .filter((collection: { name: string; }) => collection.name !== '_app_metadata')
                .map((collection: { name: string; }) => ({ name: collection.name }));
    
            return {
                status: true,
                message: `Project '${projectName}' created with service '${serviceName}'. _app_metadata created.`,
                project: { name: projectName, services },
            };
    
        } catch (error: any) {
            return { status: false, message: `Failed to create project '${projectName}': ${error.message}` };
        }
    },
    delete: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient, projectName } = params;
        try {
            const databasesBeforeDeletion = await dbClient.db().admin().listDatabases();
            const existsBeforeDeletion = databasesBeforeDeletion.databases.some(db => db.name === projectName);
    
            if (!existsBeforeDeletion) {
                return {
                    status: false,
                    message: `Project '${projectName}' does not exist.`,
                };
            }
    
            await dbClient.db(projectName).dropDatabase();
    
            const databasesAfterDeletion = await dbClient.db().admin().listDatabases();
            const existsAfterDeletion = databasesAfterDeletion.databases.some(db => db.name === projectName);
    
            if (existsAfterDeletion) {
                return {
                    status: false,
                    message: `Failed to delete project '${projectName}'.`,
                };
            } else {
                return {
                    status: true,
                    message: `Project '${projectName}' dropped successfully.`,
                };
            }
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },
    copy: async (params: ProjectOperationParams): Promise<ProjectOperationResponse> => {
        const { dbClient, projectName, targetProjectName } = params;
        try {
            const databasesList = await dbClient.db().admin().listDatabases();
            const targetDatabaseExists = databasesList.databases.some(db => db.name === targetProjectName);

            if (targetDatabaseExists) {
                return {
                    status: false,
                    message: `Target project '${targetProjectName}' already exists. Copy operation aborted.`
                };
            }

            const operationResults = [];
            const sourceProject = dbClient.db(projectName);
            const targetProject = dbClient.db(targetProjectName);
            const services = await sourceProject.listCollections().toArray();
            for (let service of services) {
                const docs = await sourceProject.collection(service.name).find({}).toArray();
                if (docs.length > 0) {
                    const operationResult = await targetProject.collection(service.name).insertMany(docs);
                    operationResults.push(operationResult);
                } else {
                   // console.log(`No documents to copy for collection: ${service.name}`);
                }
            }
            return {
                status: true,
                message: `Project '${projectName}' copied to '${targetProjectName}'.`,
                project: { name: targetProjectName } as Project,
            };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },

};

export { projects };
