require('dotenv').config({ path: './.env.local' });

import { Db } from 'mongodb';
import { initializeMongo } from './utils/initializeMongo';
import { storeCredentials } from './utils/storeCredentials';
import { updateCredentials } from './utils/updateCredentials';
import { encryptCredentials } from './utils/encryptCredentials';
import { decryptCredentials } from './utils/decryptCredentials';
import { retrieveCredentials } from './utils/retrieveCredentials';
import { validateCredentials } from './utils/validateCredentials';
import { InitializeMongoResponse } from './types';

class CredentialManager {
  dbConnection: Db | null = null;
  initDBPromise: Promise<void>;

  constructor() {
    this.initDBPromise = this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    try {
      const response: InitializeMongoResponse = await initializeMongo();
      if (response.status && response.mongoDatabase) {
        this.dbConnection = response.mongoDatabase;
        console.log(response.message); // Optional: log the success message
      } else {
        console.error('Database initialization failed:', response.message);
        throw new Error(response.message);
      }
    } catch (err: any) {
      console.error("Database initialization error:", err);
      throw err; // Rethrow or handle as needed
    }
  }

  // Ensure DB is initialized before proceeding
  public async ensureDBInit(): Promise<void> {
    await this.initDBPromise;
  }

  // Method to store credentials
  async storeCredentials(credentials: any): Promise<any> {
    const validationResponse = validateCredentials({ credentials });
    if (!validationResponse.status) {
      return { status: false, message: "Invalid credentials." };
    }

    try {
      const encryptionResponse = encryptCredentials({ credentials });
      if (!encryptionResponse.status) {
        throw new Error(encryptionResponse.message);
      }
      const storeResponse = await storeCredentials({ credentials: encryptionResponse.result });
      return { status: storeResponse.status, message: storeResponse.message };
    } catch (error: any) {
      return { status: false, message: `Storing credentials failed: ${error.message}` };
    }
  }

  // Method to retrieve credentials
  async retrieveCredentials(): Promise<any> {
    try {
      const retrieveResponse = await retrieveCredentials();
      if (!retrieveResponse.status) {
        throw new Error(retrieveResponse.message);
      }
      const decryptionResponse = decryptCredentials({ encryptedCredentials: retrieveResponse.result });
      if (!decryptionResponse.status) {
        throw new Error(decryptionResponse.message);
      }
      return { status: true, message: "Credentials retrieved successfully.", credentials: decryptionResponse.result };
    } catch (error: any) {
      return { status: false, message: `Retrieving credentials failed: ${error.message}` };
    }
  }

  // Method to update credentials
  async updateCredentials(credentials: any): Promise<any> {
    const validationResponse = validateCredentials({ credentials });
    if (!validationResponse.status) {
      return { status: false, message: "Invalid credentials." };
    }

    try {
      const encryptionResponse = encryptCredentials({ credentials });
      if (!encryptionResponse.status) {
        throw new Error(encryptionResponse.message);
      }
      const updateResponse = await updateCredentials({ credentials: encryptionResponse.result });
      return { status: updateResponse.status, message: updateResponse.message };
    } catch (error: any) {
      return { status: false, message: `Updating credentials failed: ${error.message}` };
    }
  }

  async listAllCredentials(): Promise<any> {
    try {
      // Ensure the DB initialization is complete before proceeding
      await this.ensureDBInit();
  
      if (!this.dbConnection) {
        console.error('Database connection is not initialized.');
        return;
      }
  
      const dbCollection = this.dbConnection.collection('apiKeys');
      // Use projection to exclude the _id field
      const credentials = await dbCollection.find({}, { projection: { _id: 0, services: 1 } }).toArray();
  
      // Extract services arrays and flatten the array by one level
      const servicesList = credentials.map(doc => doc.services).flat();
      return servicesList;
    } catch (error) {
      console.error(`Failed to list credentials: ${error}`);
      return []; // Return an empty array in case of an error to maintain consistent return type
    }
  }
  
}

export { CredentialManager };
