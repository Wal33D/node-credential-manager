import { Db, MongoClient } from "mongodb";
import { projects } from "./database/projects";
import { services } from "./database/services";
import { secrets } from "./database/secrets";
import { versions } from "./database/versions";

export class DatabaseManager {
  dbClient: MongoClient;
  projects: typeof projects & { services: typeof services & { secrets: typeof secrets & { versions: typeof versions } } };

  constructor(dbClient: MongoClient) {
    this.dbClient = dbClient;

    const servicesWithNestedAccess = this.bindDbClient({
      ...services,
      secrets: this.bindDbClient({
        ...secrets,
        versions: this.bindDbClient(versions)
      })
    });

    this.projects = this.bindDbClient({
      ...projects,
      services: servicesWithNestedAccess,
    });
  }

  bindDbClient(module: any): any {
    const boundModule: any = {};

    for (let key in module) {
      if (typeof module[key] === 'function') {
        boundModule[key] = module[key].bind(null, { dbClient: this.dbClient });
      } else if (typeof module[key] === 'object' && key !== 'services') { 
        boundModule[key] = this.bindDbClient(module[key]);
      } else {
        boundModule[key] = module[key];
      }
    }

    return boundModule;
  }
}
