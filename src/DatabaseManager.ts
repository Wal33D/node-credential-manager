import { Db, MongoClient } from "mongodb";
import { projects as originalProjects } from "./database/projects";
import { services as originalServices } from "./database/services";
import { secrets as originalSecrets } from "./database/secrets";
import { versions as originalVersions } from "./database/versions";

function bindDbClient(module:any , dbClient:any ) {
  const boundModule = {} as any;

  for (let key in module ) {
    if (typeof module[key] === 'function') {
      boundModule[key] = module[key].bind(null, { dbClient });
    } else if (typeof module[key] === 'object' && key !== 'services') { 
      boundModule[key] = bindDbClient(module[key], dbClient);
    } else {
      boundModule[key] = module[key];
    }
  }

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


