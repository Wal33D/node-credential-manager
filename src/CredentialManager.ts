require('dotenv').config({ path: './.env.local' });

import { OfficeManager } from './OfficeManager';

class CredentialManager {
  public offices: Map<string, OfficeManager> = new Map();

  constructor(private globalDbConfig: { dbUsername?: string; dbPassword?: string; dbCluster?: string; } = {}) {
     this.initializeAllOffices();
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
      this.offices.set(officeName, officeManager);
      console.log(`Office '${officeName}' has been successfully added and connected.`);
    } catch (error:any) {
      console.error(`Failed to initialize office '${officeName}': ${error.message}`);
    }
  }

  public async initializeAllOffices(): Promise<void> {
    for (const [officeName, officeManager] of this.offices) {
      try {
        console.log(`Office '${officeName}' initialized.`, officeManager);
      } catch (error:any) {
        console.error(`Failed to initialize office '${officeName}': ${error.message}`);
      }
    }
  }

}

export { CredentialManager };
