import { Db, MongoClient } from "mongodb";
import { projects } from "./database/projects"; 
import { services } from "./database/services";
import { secrets } from "./database/secrets"; 
import { versions } from "./database/versions"; 

class DatabaseManager {
  dbClient: MongoClient;
  projects: typeof projects;
  services: typeof services & { secrets: typeof secrets & { versions: typeof versions } };

  constructor(dbClient: MongoClient) {
    this.dbClient = dbClient;
    this.projects = { ...projects };

    // Dynamically bind `dbClient` to each function to ensure it has access to the MongoDB client
    for (let key in this.projects) {
      if (typeof this.projects[key] === 'function') {
        this.projects[key] = this.projects[key].bind(null, { dbClient: this.dbClient });
      }
    }

    this.services = { ...services, secrets: { ...secrets, versions: { ...versions } } };

    // You would need to similarly bind dbClient for services, secrets, and versions
    // This example doesn't automatically bind dbClient for services, secrets, and versions for simplicity
  }
}

// Assuming `dbClient` is an initialized and connected MongoClient instance
const databaseManager = new DatabaseManager(dbClient);

export default databaseManager;
