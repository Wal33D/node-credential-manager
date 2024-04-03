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
    this.officeManager = new OfficeManager({ officeName, dbUsername, dbPassword, dbCluster });
  }

  public async initialize(): Promise<void> {
    try {
      await this.officeManager.ensureConnection();
  
      console.log(`Initialization successful: Office '${this.officeManager.officeName}' is ready for use.`);
      const cabinetsList = await this.officeManager.listCabinets();
      console.log(`Available cabinets in '${this.officeManager.officeName}': ${cabinetsList.join(', ')}`);
      
      // Assuming 'UserCredentials' is the name of the cabinet you want to add a credential to
      const cabinetName = 'DefaultCabinet';
      const credentialName = 'ExampleCredentialName';
      const credentialValue = { username: 'exampleUser', password: 'examplePass' };

      // Access the CabinetManager for the specific cabinet
      const cabinetManager = this.officeManager.cabinetManagers.get(cabinetName);
      if (cabinetManager) {
        // Use the CabinetManager's ServiceManager to add a credential
        const serviceManager = cabinetManager.serviceManagers.get(cabinetName);
        if (serviceManager) {
          const addResult = await serviceManager.addCredential(credentialName, credentialValue);
          if (addResult.status) {
            console.log(`Credential added successfully to '${cabinetName}' cabinet.`);
          } else {
            console.error(`Failed to add credential: ${addResult.message}`);
          }
        } else {
          console.error(`ServiceManager for '${cabinetName}' not found.`);
        }
      } else {
        console.error(`CabinetManager for '${cabinetName}' not found.`);
      }
    } catch (error: any) {
      console.error(`Initialization failed: ${error.message}`);
      throw error;
    }
}

  
  
}

export { CredentialManager };
