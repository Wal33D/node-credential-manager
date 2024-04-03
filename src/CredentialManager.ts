require('dotenv').config({ path: './.env.local' });

import { OfficeManager } from './OfficeManager';

interface CredentialManagerParams {
  dbUsername?: string;
  dbPassword?: string;
  dbCluster?: string;
  officeName?: string;
}

class CredentialManager {
  private officeManager: OfficeManager;

  constructor({
    dbUsername = process.env.DB_USERNAME || "admin", 
    dbPassword = process.env.DB_PASSWORD || "password", 
    dbCluster = process.env.DB_CLUSTER || "cluster0.example.mongodb.net", 
    officeName = process.env.DEFAULT_OFFICE_NAME || "DefaultOffice"
  }: CredentialManagerParams = {}) {
    // Initialize OfficeManager with provided or default parameters
    this.officeManager = new OfficeManager({ officeName, dbUsername, dbPassword, dbCluster });
  }

  public async initialize(): Promise<void> {
    try {
        await this.officeManager.ensureConnection();

        console.log(`Initialization successful: Office '${this.officeManager.officeName}' is ready for use.`);
        const cabinetsList = await this.officeManager.listCabinets();
        console.log(`Available cabinets in '${this.officeManager.officeName}': ${cabinetsList.join(', ')}`);
    } catch (error: any) {
        console.error(`Initialization failed: ${error.message}`);
        throw error;
    }
}

}

export { CredentialManager };
