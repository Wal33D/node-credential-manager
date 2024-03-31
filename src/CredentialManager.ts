require('dotenv').config({ path: './.env.local' });

import { Db } from 'mongodb';
import { initializeMongo } from './utils/initializeMongo';
//import { storeCredentials } from './utils/storeCredentials';
//import { updateCredentials } from './utils/updateCredentials';
//import { encryptCredentials } from './utils/encryptCredentials';
//import { decryptCredentials } from './utils/decryptCredentials';
//import { retrieveCredentials } from './utils/retrieveCredentials';
//import { validateCredentials } from './utils/validateCredentials';
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

  async getAllCredentials(): Promise<{
    status: boolean;
    credentials: any[];
    message: string;
    servicesCount: number;
    totalCredentials: number;
    databaseName: string;
  }> {
    let status = false;
    let credentialsList: any[] = [];
    let message = '';
    let servicesCount = 0; 
    let totalCredentials = 0; 
    let databaseName = ''; 

    try {
      await this.ensureDBInit();

      if (!this.dbConnection) {
        message = 'Database connection is not initialized.';
        return {
          status,
          credentials: credentialsList,
          message,
          servicesCount,
          totalCredentials,
          databaseName,
        };
      }

      databaseName = this.dbConnection.databaseName;

      const dbCollection = this.dbConnection.collection('apiKeys');
      const credentials = await dbCollection.find({}, { projection: { _id: 0, services: 1 } }).toArray();

      credentialsList = credentials.map(doc => {
        if (doc.services) {
          totalCredentials += doc.services.reduce((acc: any, service: { keys: string | any[]; }) => acc + service.keys.length, 0);
        }
        return doc.services;
      }).flat(); 

      status = true;
      message = 'Credentials listed successfully.';
      servicesCount = credentialsList.length; 
    } catch (error) {
      message = `Failed to list credentials: ${error}`;
    }

    return {
      status,
      credentials: credentialsList,
      message,
      servicesCount,
      totalCredentials,
      databaseName,
    };
  }
}
export { CredentialManager };
