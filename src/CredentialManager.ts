require('dotenv').config({ path: './.env.local' });

import { OfficeManager } from './OfficeManager';

interface CredentialManagerParams {
  officeName?: string;
  dbUsername?: string;
  dbPassword?: string;
  dbCluster?: string;
}

class CredentialManager {
  private officeManager: OfficeManager;

  constructor({
    officeName = process.env.DEFAULT_OFFICE_NAME || "DefaultOffice",
    dbUsername = process.env.DB_USERNAME!,
    dbPassword = process.env.DB_PASSWORD!,
    dbCluster = process.env.DB_CLUSTER!
  }: CredentialManagerParams = {}) {
    if (!dbUsername || !dbPassword || !dbCluster) {
      throw new Error("Missing MongoDB credentials. Please provide them via environment variables or constructor parameters.");
    }

    this.officeManager = new OfficeManager({ officeName, dbUsername, dbPassword, dbCluster });
  }

  public async initialize(): Promise<void> {
    try {
      await this.officeManager.ensureConnection();
      console.log(`Initialization successful: Office '${this.officeManager.officeName}' is ready for use.`);
    } catch (error: any) {
      console.error(`Initialization failed: ${error.message}`);
      throw error; 
    }
  }

  public cabinet(cabinetName: string = process.env.DEFAULT_CABINET_NAME || "DefaultCabinet") {
    console.log(`Returning cabinet: ${cabinetName}`);
    // return this.officeManager.cabinet(cabinetName);
  }
}

export { CredentialManager };
