import { Db, MongoClient } from "mongodb";
import { projects as originalProjects } from "./database/projects";
import { services as originalServices } from "./database/services";
import { secrets as originalSecrets } from "./database/secrets";
import { versions as originalVersions } from "./database/versions";

function bindDbClient(module: any, dbClient: MongoClient) {
    const boundModule: any = {};

    Object.keys(module).forEach((key) => {
        if (typeof module[key] === 'function') {
            // Wrap the original function instead of binding dbClient
            boundModule[key] = async (...args: any[]) => await module[key]({ dbClient, ...args[0] });
        } else if (typeof module[key] === 'object' && key !== 'services') {
            // Recurse for nested objects
            boundModule[key] = bindDbClient(module[key], dbClient);
        } else {
            // Directly assign non-function properties
            boundModule[key] = module[key];
        }
    });

    return boundModule;
}

export function createDatabaseManager(dbClient: MongoClient) {
    const servicesWithNestedAccess = bindDbClient({
        ...originalServices,
        secrets: bindDbClient({
            ...originalSecrets,
            versions: bindDbClient(originalVersions, dbClient)
        }, dbClient)
    }, dbClient);

    const projects = bindDbClient({
        ...originalProjects,
        services: servicesWithNestedAccess,
    }, dbClient);

    return {
        projects,
        services: servicesWithNestedAccess,
        secrets: servicesWithNestedAccess.secrets,
        versions: servicesWithNestedAccess.secrets.versions,
    };
}


