require('dotenv').config({ path: './.env.local' });

import { Db } from 'mongodb';
import { initializeMongo } from './utils/initializeMongo';
import { InitializeMongoResponse } from './types';

let collectionName = 'testKeys';

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
    await this.ensureDBInit();
    let status = false;
    let message = '';
    let databaseName = '';
    let credentialsList:any = [];
  
    if (!this.dbConnection) {
      message = 'Database connection is not initialized.';
      return { status, message, credentials: credentialsList, servicesCount: 0, totalCredentials: 0, databaseName, collectionName };
    }
  
    databaseName = this.dbConnection.databaseName;
  
    try {
      const dbCollection = this.dbConnection.collection(collectionName);
      const services = await dbCollection.find({}).toArray();
  
      credentialsList = services; // Each document is a service with its keys.
      const servicesCount = services.length;
      const totalCredentials = services.reduce((acc, service) => acc + service.keys.length, 0);
  
      status = true;
      message = 'Loaded successfully.';
      return { status, credentials: credentialsList, message, servicesCount, totalCredentials, databaseName, collectionName };
    } catch (error) {
      console.error(`Failed to load credentials: ${error}`);
      return { status, credentials: [], message: `Failed to load credentials: ${error}`, servicesCount: 0, totalCredentials: 0, databaseName, collectionName };
    }
  }
  

  async initializeCredentialsCollection(collectionName: string): Promise<{ status: boolean; message: string }> {
    await this.ensureDBInit(); // Ensure the DB is initialized

    if (!this.dbConnection) {
      return { status: false, message: "Database connection is not initialized." };
    }

    try {
      // Check if the collection already exists
      const collections = await this.dbConnection.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
      if (collections.length === 0) {
        // The collection does not exist, so initialize it with the default structure
        await this.dbConnection.collection(collectionName).insertOne({
          services: [] // Start with an empty services array
        });
        return { status: true, message: "Collection initialized with default structure." };
      } else {
        // The collection already exists
        return { status: true, message: "Collection already exists, no changes made." };
      }
    } catch (error) {
      console.error(`Failed to initialize the ${collectionName} collection: ${error}`);
      return { status: false, message: `Failed to initialize the collection: ${error}` };
    }
  }

}
export { CredentialManager };
