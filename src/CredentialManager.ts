require('dotenv').config({ path: './.env' });

import { MongoClient } from "mongodb"; 
import { ProjectManager } from './ProjectManager';

class CredentialManager {
  public projects: Map<string, ProjectManager> = new Map();
  private defaultProjectName = process.env.DEFAULT_OFFICE_NAME || "DefaultProject";
  private dbClient: MongoClient; 

  // Adjust constructor to accept a MongoClient instance
  constructor(dbClient: MongoClient) {
    this.dbClient = dbClient;
    console.log('CredentialManager initialized with MongoDB client');
    this.initializeAllProjects();
  }

  public async initializeAllProjects(): Promise<void> {
    const databaseNames = await this.listAllDatabases();
    let metadataFound = false;
  
    // Check each database for the _appMetadata collection
    for (const dbName of databaseNames) {
      // Adjust ProjectManager instances to use the shared MongoClient
      const projectManager = new ProjectManager({
        projectName: dbName,
        dbClient: this.dbClient, 
      });
  
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

    // Create and add the ProjectManager instance with the shared MongoClient
    const projectManager = new ProjectManager({ projectName, dbCluster: this.dbClient });
    this.projects.set(projectName, projectManager);
    console.log(`Project '${projectName}' has been successfully added.`);
  }

  private async listAllDatabases(): Promise<string[]> {
    try {
      await this.dbClient.connect();
      const databasesList = await this.dbClient.db().admin().listDatabases();
      const filteredDatabases = databasesList.databases
                              .map(db => db.name)
                              .filter(name => name !== 'admin' && name !== 'local');
      return filteredDatabases;
    } finally {
      // Do not close the client; it is shared and managed externally
    }
  }
}

export { CredentialManager };
