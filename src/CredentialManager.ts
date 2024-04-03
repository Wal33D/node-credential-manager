require('dotenv').config({ path: './.env.local' });

import { MongoClient } from 'mongodb';
import { OfficeManager } from './OfficeManager';

class CredentialManager {
  public offices: Map<string, OfficeManager> = new Map();
  private defaultOfficeName = process.env.DEFAULT_OFFICE_NAME || "DefaultOffice";
  private globalDbConfig: { dbUsername: string; dbPassword: string; dbCluster: string; };

  constructor(globalDbConfig: { dbUsername?: string; dbPassword?: string; dbCluster?: string; } = {}) {
    this.globalDbConfig = {
      dbUsername: globalDbConfig.dbUsername || process.env.DB_USERNAME || "admin",
      dbPassword: globalDbConfig.dbPassword || process.env.DB_PASSWORD || "password",
      dbCluster: globalDbConfig.dbCluster || process.env.DB_CLUSTER || "cluster0.example.mongodb.net",
    };
    console.log(this.globalDbConfig)
    this.initializeAllOffices();
  }

  public async initializeAllOffices(): Promise<void> {
    const databaseNames = await this.listAllDatabases();
    let metadataFound = false;

    for (const dbName of databaseNames) {
      const officeManager = new OfficeManager({
        officeName: dbName,
        ...this.globalDbConfig,
      });

      await officeManager.ensureConnection();
      const hasMetadata = await officeManager.collectionExists("_appMetadata");

      if (hasMetadata) {
        this.offices.set(dbName, officeManager);
        console.log(`Office '${dbName}' loaded into Credential Manager.`);
        metadataFound = true;
      }
    }

    // Create the default office only if no office with _appMetadata was found
    if (!metadataFound) {
      console.log("No existing offices found with metadata. Creating the default office...");
      await this.addOffice({ officeName: this.defaultOfficeName });
    }
  }

  private async addDefaultOffice(): Promise<void> {
    await this.addOffice({ officeName: this.defaultOfficeName });
  }

  public async addOffice(officeParams: { officeName: string }): Promise<void> {
    const { officeName } = officeParams;
    if (this.offices.has(officeName)) {
      console.log(`Office '${officeName}' already exists in the Credential Manager.`);
      return;
    }

    const officeManager = new OfficeManager({ officeName, ...this.globalDbConfig });
    try {
      await officeManager.ensureConnection();
      this.offices.set(officeName, officeManager);
      console.log(`Office '${officeName}' has been successfully added and connected.`);
    } catch (error: any) {
      console.error(`Failed to initialize office '${officeName}': ${error.message}`);
    }
  }

  private async listAllDatabases(): Promise<string[]> {
    const client = new MongoClient(this.connectionString());
    await client.connect();
    const databasesList = await client.db().admin().listDatabases();
    client.close();
    return databasesList.databases.map(db => db.name);
  }

  private connectionString(): string {
    return `mongodb+srv://${encodeURIComponent(this.globalDbConfig.dbUsername)}:${encodeURIComponent(this.globalDbConfig.dbPassword)}@${this.globalDbConfig.dbCluster}`;
  }
}

export { CredentialManager };
