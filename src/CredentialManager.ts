require('dotenv').config({ path: './.env.local' });

import { OfficeManager } from './OfficeManager';

// Define TypeScript interfaces for the constructor parameters to clarify expected types
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

    // Assuming OfficeManager's constructor and/or methods are adjusted to accept these credentials as parameters
    this.officeManager = new OfficeManager({officeName, dbUsername, dbPassword, dbCluster});
  }

  public async initialize(): Promise<void> {
    // Initialization logic...
  }

  public cabinet(cabinetName: string = process.env.DEFAULT_CABINET_NAME || "DefaultCabinet") {
    return this.officeManager.cabinet(cabinetName);
  }
}

export { CredentialManager };
