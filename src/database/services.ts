import { Secret, ServiceOperationParams, ServiceOperationResponse,Service  } from "./databaseTypes";
import { writeFile } from "fs/promises"; 
import { join } from "path"; 
const services = {
    list: async ({ dbClient, projectName }: ServiceOperationParams): Promise<ServiceOperationResponse> => {
        try {
            const allCollections = await dbClient.db(projectName).listCollections().toArray();
            // Filter out the _app_metadata collection from the list
            const filteredCollections = allCollections.filter(collection => collection.name !== '_app_metadata');
            const services = filteredCollections.map(collection => collection.name);
            return { status: true, message: "Services listed successfully.", services };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },

    add: async ({ dbClient, projectName, serviceName }: ServiceOperationParams): Promise<ServiceOperationResponse> => {
        if (!serviceName) throw new Error("Service name is required.");
        try {
            await dbClient.db(projectName).createCollection(serviceName);
            return { status: true, message: `Service '${serviceName}' added.`};
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },

    rename: async ({ dbClient, projectName, serviceName, newServiceName }: ServiceOperationParams): Promise<ServiceOperationResponse> => {
        if (!serviceName || !newServiceName) throw new Error("Both old and new service names are required.");
        try {
            await dbClient.db(projectName).collection(serviceName).rename(newServiceName);
            return { status: true, message: `Service renamed from '${serviceName}' to '${newServiceName}'.`};
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },

    remove: async ({ dbClient, projectName, serviceName }: ServiceOperationParams): Promise<ServiceOperationResponse> => {
        if (!serviceName) throw new Error("Service name is required.");
        try {
            await dbClient.db(projectName).dropCollection(serviceName);
            return { status: true, message: `Service '${serviceName}' removed.` };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },

    exists: async ({ dbClient, projectName, serviceName }: ServiceOperationParams): Promise<ServiceOperationResponse> => {
        if (!serviceName) throw new Error("Service name is required.");
        try {
            if (serviceName === '_app_metadata') {
                return { status: false, message: "Checking for _app_metadata is not allowed.", exists: false };
            }
            const services = await dbClient.db(projectName).listCollections({ name: serviceName }, { nameOnly: true }).toArray();
            const exists = services.length > 0;
            return { status: true, message: exists ? `Service '${serviceName}' exists.` : `Service '${serviceName}' does not exist.`, exists };
        } catch (error: any) {
            return { status: false, message: "An error occurred while checking if the service exists.", exists: false };
        }
    },

    getService: async ({ dbClient, projectName, serviceName }: ServiceOperationParams): Promise<ServiceOperationResponse> => {
        if (!serviceName) {
            return { status: false, message: "Service name is required." };
        }
        if (serviceName === '_app_metadata') {
            return { status: false, message: "Accessing _app_metadata directly is not allowed." };
        }
        try {
            const serviceCollection = dbClient.db(projectName).collection(serviceName);
            const secrets = await serviceCollection.find({}).toArray() as Secret[];
            const service: Service = {
                serviceName,
                secrets
            };
            return { status: true, message: `Service '${serviceName}' retrieved successfully.`, service };
        } catch (error: any) {
            return { status: false, message: error.message };
        }
    },
    exportAllServicesToEnv: async ({ dbClient, projectName, outputDir = '.' }: ServiceOperationParams & { outputDir?: string }): Promise<ServiceOperationResponse> => {
        try {
            const allServicesResponse = await services.list({ dbClient, projectName }) as any;
            if (!allServicesResponse.status) {
                throw new Error(`Failed to list services for project: ${projectName}`);
            }

            let envContent = '';

            for (const serviceName of allServicesResponse.services) {
                const serviceResponse = await services.getService({ dbClient, projectName, serviceName }) as any;
                if (serviceResponse.status && serviceResponse.service) {
                    const secretsEnv = serviceResponse.service.secrets.map((secret: { versions: string | any[]; envName: any; }) => {
                        // Assuming the latest version is the last in the versions array
                        const latestVersion = secret.versions[secret.versions.length - 1];
                        return `${secret.envName}=${latestVersion.value}`;
                    }).join('\n');

                    envContent += secretsEnv + '\n';
                }
            }

            if (envContent) {
                // Determine the file path and write the .env file
                const filePath = join(outputDir, `${projectName}.env`);
                await writeFile(filePath, envContent, 'utf8');

                return { status: true, message: `All services and secrets exported to .env file at '${filePath}'.` };
            } else {
                return { status: false, message: "No secrets found to export." };
            }
        } catch (error: any) {
            return { status: false, message: `Failed to export all services to .env: ${error.message}` };
        }
    }
};

export { services };