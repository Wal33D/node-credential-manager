require('dotenv').config({ path: './.env.local' });

import { OfficeManager } from './OfficeManager';

class CredentialManager {
  private offices: Map<string, OfficeManager> = new Map();

  constructor(private globalDbConfig: { dbUsername?: string; dbPassword?: string; dbCluster?: string; } = {}) {
    // Load initial configuration or any persisted office configurations here.
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
      await officeManager.ensureConnection();
      this.offices.set(officeName, officeManager);
      console.log(`Office '${officeName}' has been successfully added and connected.`);
    } catch (error:any) {
      console.error(`Failed to initialize office '${officeName}': ${error.message}`);
    }
  }

  // Initializes all offices. Could be used at the application start to ensure all configured databases are connected.
  public async initializeAllOffices(): Promise<void> {
    for (const [officeName, officeManager] of this.offices) {
      try {
        await officeManager.ensureConnection();
        console.log(`Office '${officeName}' initialized.`);
      } catch (error:any) {
        console.error(`Failed to initialize office '${officeName}': ${error.message}`);
      }
    }
  }

  // Example method to interact with a specific office (database).
  public async listCabinetsInOffice(officeName: string): Promise<void> {
    const officeManager = this.offices.get(officeName);
    if (!officeManager) {
      console.error(`Office '${officeName}' does not exist.`);
      return;
    }

    try {
      const cabinets = await officeManager.listCabinets();
      console.log(`Available cabinets in '${officeName}': ${cabinets.join(', ')}`);
    } catch (error:any) {
      console.error(`Error listing cabinets in office '${officeName}': ${error.message}`);
    }
  }

  // You can add more methods here to manage or interact with specific offices or their collections and documents.
}

export { CredentialManager };
