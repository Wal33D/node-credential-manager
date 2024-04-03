require('dotenv').config({ path: './.env.local' });

import { OfficeManager } from './OfficeManager';

interface CredentialManagerParams {
  dbUsername?: string;
  dbPassword?: string;
  dbCluster?: string;
  officeName?: string;
  defaultCabinetName?: string;
}

class CredentialManager {
  private officeManager: OfficeManager;
  private defaultCabinetName: string;

  constructor({
    dbUsername = process.env.DB_USERNAME || "admin", 
    dbPassword = process.env.DB_PASSWORD || "password", 
    dbCluster = process.env.DB_CLUSTER || "cluster0.example.mongodb.net", 
    officeName = process.env.DEFAULT_OFFICE_NAME || "DefaultOffice",
    defaultCabinetName = process.env.DEFAULT_CABINET_NAME || "DefaultCabinet" 
  }: CredentialManagerParams = {}) {
    this.defaultCabinetName = defaultCabinetName;

    // Passing all parameters including defaultCabinetName to OfficeManager
    this.officeManager = new OfficeManager({ officeName, dbUsername, dbPassword, dbCluster, defaultCabinetName });
  }

  public async initialize(): Promise<void> {
    try {
      await this.officeManager.ensureConnection();
      console.log(`Initialization successful: Office '${this.officeManager.officeName}' is ready for use with default cabinet '${this.defaultCabinetName}'.`);
    } catch (error: any) {
      console.error(`Initialization failed: ${error.message}`);
      throw error; 
    }
  }
}

export { CredentialManager };
