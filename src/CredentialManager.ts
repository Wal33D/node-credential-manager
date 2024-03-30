import { MongoClient } from 'mongodb';
import { storeCredentials } from './utils/storeCredentials';
import { updateCredentials } from './utils/updateCredentials';
import { encryptCredentials } from './utils/encryptCredentials';
import { decryptCredentials } from './utils/decryptCredentials';
import { retrieveCredentials } from './utils/retrieveCredentials';
import { validateCredentials } from './utils/validateCredentials';

class CredentialManager {
  
  private dbConnection: MongoClient;

  constructor(dbConnection: MongoClient) {
    this.dbConnection = dbConnection;
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

  async listAllCredentials(): Promise<void> {
    try {
      const dbCollection = this.dbConnection.db().collection('apiKeys');
      const credentials = await dbCollection.find({}).toArray();

      console.log('Listing all credentials:');
      console.log(credentials);
    } catch (error) {
      console.error(`Failed to list credentials: ${error}`);
    }
  }

}

export { CredentialManager };
