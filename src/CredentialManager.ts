require('dotenv').config({ path: './.env.local' });

import { OfficeManager } from './OfficeManager';

class CredentialManager {
  public offices: Map<string, OfficeManager> = new Map();

  constructor(private globalDbConfig: { dbUsername?: string; dbPassword?: string; dbCluster?: string; } = {}) {
    // Initialize with a default office if none exists
    this.initializeDefaultOffice();
  }

  private async initializeDefaultOffice(): Promise<void> {
    const defaultOfficeName = process.env.DEFAULT_OFFICE_NAME || "DefaultOffice";

    if (!this.offices.has(defaultOfficeName)) {
      await this.addOffice({
        officeName: defaultOfficeName,
        dbUsername: this.globalDbConfig.dbUsername,
        dbPassword: this.globalDbConfig.dbPassword,
        dbCluster: this.globalDbConfig.dbCluster,
      });

      // Log to confirm that the default office was indeed added
      if (this.offices.has(defaultOfficeName)) {
        console.log(`Default office '${defaultOfficeName}' added to the Credential Manager.`);
      } else {
        console.error(`Failed to add default office '${defaultOfficeName}' to the Credential Manager.`);
      }
    } else {
      console.log(`Default office '${defaultOfficeName}' already exists in the Credential Manager.`);
    }

    await this.initializeAllOffices();
  }

  public async addOffice(officeParams: { officeName: string, dbUsername?: string, dbPassword?: string, dbCluster?: string }): Promise<void> {
    const { officeName, dbUsername, dbPassword, dbCluster } = officeParams;
    const officeManager = new OfficeManager({
      officeName,
      dbUsername: dbUsername || this.globalDbConfig.dbUsername || process.env.DB_USERNAME || "admin",
      dbPassword: dbPassword || this.globalDbConfig.dbPassword || process.env.DB_PASSWORD || "password",
      dbCluster: dbCluster || this.globalDbConfig.dbCluster || process.env.DB_CLUSTER || "cluster0.example.mongodb.net",
    });

    try {
      // Ensure the office manager connects and initializes the office (database)
      await officeManager.ensureConnection();
      this.offices.set(officeName, officeManager);
      console.log(`Office '${officeName}' has been successfully added and connected.`);
    } catch (error: any) {
      console.error(`Failed to initialize office '${officeName}': ${error.message}`);
    }
  }

  public async initializeAllOffices(): Promise<void> {
    for (const [officeName, officeManager] of this.offices) {
      try {
        // Ensure connection for each officeManager
        await officeManager.ensureConnection();
        console.log(`Office '${officeName}' initialized.`);
      } catch (error: any) {
        console.error(`Failed to initialize office '${officeName}': ${error.message}`);
      }
    }
  }
}

export { CredentialManager };
