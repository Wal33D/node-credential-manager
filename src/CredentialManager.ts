require('dotenv').config({ path: './.env.local' });

import { MongoClient } from 'mongodb';
import { OfficeManager } from './OfficeManager';

class CredentialManager {
  public offices: Map<string, OfficeManager> = new Map();
  private defaultOfficeName = process.env.DEFAULT_OFFICE_NAME || "DefaultOffice";

  constructor() {
    this.initializeAllOffices();
  }

  private async addDefaultOffice(): Promise<void> {
    await this.addOffice({
      officeName: this.defaultOfficeName,
      dbUsername: process.env.DB_USERNAME || "admin",
      dbPassword: process.env.DB_PASSWORD || "password",
      dbCluster: process.env.DB_CLUSTER || "cluster0.example.mongodb.net",
    });
    // Removed redundant call to initializeAllOffices here, as it's already called in the constructor
  }

  public async addOffice({
    officeName,
    dbUsername = process.env.DB_USERNAME || "admin",
    dbPassword = process.env.DB_PASSWORD || "password",
    dbCluster = process.env.DB_CLUSTER || "cluster0.example.mongodb.net"}:
    { officeName: string, dbUsername?: string, dbPassword?: string, dbCluster?: string }): Promise<void> {
      
    if (this.offices.has(officeName)) {
      console.log(`Office '${officeName}' already exists in the Credential Manager.`);
      return;
    }

    const officeManager = new OfficeManager({ officeName, dbUsername, dbPassword, dbCluster });
    try {
      await officeManager.ensureConnection();
      this.offices.set(officeName, officeManager);
      console.log(`Office '${officeName}' has been successfully added and connected.`);
    } catch (error: any) {
      console.error(`Failed to initialize office '${officeName}': ${error.message}`);
    }
  }

  

  public async initializeAllOffices(): Promise<void> {
    const databaseNames = await this.listAllDatabases();
    const metadataExistsPromises = databaseNames.map(async dbName => {
      const officeManager = new OfficeManager({
        officeName: dbName,
        dbUsername: this.dbUsername || process.env.DB_USERNAME || "admin",
        dbPassword: this.dbPassword || process.env.DB_PASSWORD || "password",
        dbCluster: this.dbCluster || process.env.DB_CLUSTER || "cluster0.example.mongodb.net",
      });
  
      await officeManager.ensureConnection();
      const hasMetadata = await officeManager.collectionExists("_appMetadata");
  
      if (hasMetadata) {
        this.offices.set(dbName, officeManager);
        console.log(`Office '${dbName}' loaded into Credential Manager.`);
      }
  
      return hasMetadata;
    });
  
    const officesLoaded = await Promise.all(metadataExistsPromises);
    if (officesLoaded.every(loaded => !loaded)) {
      console.log("No existing offices found with metadata. Creating the default office...");
      await this.addDefaultOffice();
    }
  }
  
  private async listAllDatabases(): Promise<string[]> {
    const uri = `mongodb+srv://${encodeURIComponent(process.env.DB_USERNAME || "admin")}:${encodeURIComponent(process.env.DB_PASSWORD || "password")}@${process.env.DB_CLUSTER || "cluster0.example.mongodb.net"}`;
    const client = new MongoClient(uri);
    await client.connect();
    const databasesList = await client.db().admin().listDatabases();
    await client.close();
    return databasesList.databases.map(db => db.name);
  }
}

export { CredentialManager };
