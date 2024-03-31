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

let collectionName = 'apiKeys';

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
      } else {
        console.error('Database initialization failed:', response.message);
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error("Database initialization error:", error.message);
      throw error; // Rethrow or handle as needed
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
    collectionName: string;
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
          collectionName,
        };
      }

      databaseName = this.dbConnection.databaseName;

      const dbCollection = this.dbConnection.collection(collectionName);
      const credentials = await dbCollection.find({}, { projection: { _id: 0, services: 1 } }).toArray();

      credentialsList = credentials.map(doc => {
        if (doc.services) {
          totalCredentials += doc.services.reduce((acc: any, service: { keys: string | any[]; }) => acc + service.keys.length, 0);
        }
        return doc.services;
      }).flat();

      status = true;
      message = 'Loaded successfully.';
      servicesCount = credentialsList.length;
    } catch (error) {
      message = `Failed to load credentials: ${error}`;
    }

    return {
      status,
      credentials: credentialsList,
      message,
      servicesCount,
      totalCredentials,
      databaseName,
      collectionName,
    };
  }
}
export { CredentialManager };
