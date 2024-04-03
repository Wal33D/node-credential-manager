require('dotenv').config({ path: './.env.local' });

import { OfficeManager } from './OfficeManager';

interface OfficeParams {
  officeName: string;
  dbUsername: string;
  dbPassword: string;
  dbCluster: string;
}

class CredentialManager {
  private offices: Map<string, OfficeManager> = new Map();

  constructor(private globalDbConfig: { dbUsername?: string; dbPassword?: string; dbCluster?: string; } = {}) {
    // Initially, no offices are loaded.
  }

  public async addOffice({ officeName, dbUsername, dbPassword, dbCluster }: OfficeParams): Promise<void> {
    const officeManager = new OfficeManager({
      officeName,
      dbUsername: dbUsername || process.env.DB_USERNAME || "admin",
      dbPassword: dbPassword || process.env.DB_PASSWORD || "password",
      dbCluster: dbCluster || process.env.DB_CLUSTER || "cluster0.example.mongodb.net",
    });

    try {
      await officeManager.ensureConnection();
      this.offices.set(officeName, officeManager);
      console.log(`Office '${officeName}' has been successfully added and connected.`);
    } catch (error:any) {
      console.error(`Failed to initialize office '${officeName}': ${error.message}`);
    }
  }

  public async initializeOffice(officeName: string): Promise<void> {
    const officeManager = this.offices.get(officeName);
    if (!officeManager) {
      console.error(`Office '${officeName}' does not exist.`);
      return;
    }

    try {
      await officeManager.ensureConnection();
      console.log(`Office '${officeManager.officeName}' is ready for use.`);
      const cabinetsList = await officeManager.listCabinets();
      console.log(`Available cabinets in '${officeManager.officeName}': ${cabinetsList.join(', ')}`);
    } catch (error:any) {
      console.error(`Initialization of office '${officeName}' failed: ${error.message}`);
    }
  }

}

export { CredentialManager };
