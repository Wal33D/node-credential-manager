import { Db, MongoClient } from "mongodb";
import { projects } from "./database/projects";
import { services } from "./database/services";
import { secrets } from "./database/secrets";
import { versions } from "./database/versions";

export class DatabaseManager {
  dbClient: MongoClient;
  projects: typeof projects;
  services: typeof services & { secrets: typeof secrets & { versions: typeof versions } };

  constructor(dbClient: MongoClient) {
    this.dbClient = dbClient;

    // Bind dbClient for projects
    this.projects = this.bindDbClient(projects);

    // Recursively bind dbClient for services, including nested secrets and versions
    this.services = this.bindDbClient({
      ...services,
      secrets: this.bindDbClient({
        ...secrets,
        versions: this.bindDbClient(versions)
      })
    });
  }

  bindDbClient(module: any): any {
    const boundModule: any = {};

    for (let key in module) {
      if (typeof module[key] === 'function') {
        // For functions, bind dbClient as the first argument
        boundModule[key] = module[key].bind(null, { dbClient: this.dbClient });
      } else if (typeof module[key] === 'object') {
        // For nested objects, recurse
        boundModule[key] = this.bindDbClient(module[key]);
      } else {
        // For non-function properties, simply copy them
        boundModule[key] = module[key];
      }
    }

    return boundModule;
  }
}
