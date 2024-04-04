require('dotenv').config({ path: './.env.local' });

import { MongoClient } from 'mongodb';
import { ProjectManager } from './ProjectManager';

class CredentialManager {
  public projects: Map<string, ProjectManager> = new Map();
  private defaultProjectName = process.env.DEFAULT_OFFICE_NAME || "DefaultProject";
  private globalDbConfig: { dbUsername: string; dbPassword: string; dbCluster: string; };

  constructor(globalDbConfig: { dbUsername?: string; dbPassword?: string; dbCluster?: string; } = {}) {
    this.globalDbConfig = {
      dbUsername: globalDbConfig.dbUsername || process.env.DB_USERNAME || "admin",
      dbPassword: globalDbConfig.dbPassword || process.env.DB_PASSWORD || "password",
      dbCluster: globalDbConfig.dbCluster || process.env.DB_CLUSTER || "cluster0.example.mongodb.net",
    };
    console.log(this.globalDbConfig)
    this.initializeAllProjects();
  }

  public async initializeAllProjects(): Promise<void> {
    const databaseNames = await this.listAllDatabases();
    let metadataFound = false;
  
    // Check each database for the _appMetadata collection
    for (const dbName of databaseNames) {
      const projectManager = new ProjectManager({
        projectName: dbName,
        ...this.globalDbConfig,
      });
  
      await projectManager.ensureConnection();
      const hasMetadata = await projectManager.collectionExists("_appMetadata");
  
      if (hasMetadata) {
        this.projects.set(dbName, projectManager);
        console.log(`Project '${dbName}' loaded into Credential Manager.`);
        metadataFound = true;
        break;
      }
    }
  
    if (!metadataFound) {
      console.log("Creating the default project with _appMetadata...");
      await this.addProject({ projectName: this.defaultProjectName });
  
      // Ensure the newly created default project has the _appMetadata collection
      const defaultProjectManager = this.projects.get(this.defaultProjectName);
      if (defaultProjectManager) {
        await defaultProjectManager.ensureAppMetadata();
      }
    }
  }

  public async addProject(projectParams: { projectName: string }): Promise<void> {
    const { projectName } = projectParams;
    if (this.projects.has(projectName)) {
      console.log(`Project '${projectName}' already exists in the Credential Manager.`);
      return;
    }

    const projectManager = new ProjectManager({ projectName, ...this.globalDbConfig });
    try {
      await projectManager.ensureConnection();
      this.projects.set(projectName, projectManager);
      console.log(`Project '${projectName}' has been successfully added and connected.`);
    } catch (error: any) {
      console.error(`Failed to initialize project '${projectName}': ${error.message}`);
    }
  }

  private async listAllDatabases(): Promise<string[]> {
    const client = new MongoClient(this.connectionString());
    try {
      await client.connect();
      const databasesList = await client.db().admin().listDatabases();
      const filteredDatabases = databasesList.databases
                              .map(db => db.name)
                              .filter(name => name !== 'admin' && name !== 'local');
      return filteredDatabases;
    } finally {
      await client.close();
    }
  }  

  private connectionString(): string {
    return `mongodb+srv://${encodeURIComponent(this.globalDbConfig.dbUsername)}:${encodeURIComponent(this.globalDbConfig.dbPassword)}@${this.globalDbConfig.dbCluster}`;
  }
}

export { CredentialManager };
