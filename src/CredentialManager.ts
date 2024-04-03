require('dotenv').config({ path: './.env.local' });

import { OfficeManager } from './OfficeManager';

class CredentialManager {
  public offices: Map<string, OfficeManager> = new Map();
  private defaultOfficeName = process.env.DEFAULT_OFFICE_NAME || "DefaultOffice";

  constructor(private globalDbConfig: { dbUsername?: string; dbPassword?: string; dbCluster?: string; } = {}) {
    this.addDefaultOffice();
  }

  private async addDefaultOffice(): Promise<void> {
    await this.addOffice({
      officeName: this.defaultOfficeName,
      ...this.globalDbConfig,
    });

    await this.initializeAllOffices();
  }

  public async addOffice({
    officeName,
    dbUsername = process.env.DB_USERNAME || "admin",
    dbPassword = process.env.DB_PASSWORD || "password",
    dbCluster = process.env.DB_CLUSTER || "cluster0.example.mongodb.net" }:
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
    const initializationPromises = Array.from(this.offices.values()).map(officeManager => officeManager.ensureConnection().then(() => console.log(`Office '${officeManager.officeName}' initialized.`)).catch(error => console.error(`Failed to initialize office '${officeManager.officeName}': ${error.message}`)));
    await Promise.all(initializationPromises);
  }
}

export { CredentialManager };
