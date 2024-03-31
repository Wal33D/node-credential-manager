require('dotenv').config({ path: './.env.local' });

import { Db } from 'mongodb';
import { initializeMongo } from './utils/initializeMongo';
import { InitializeMongoResponse } from './types';

class CredentialManager {
  dbConnection: Db | null = null;
  initDBPromise: Promise<void>;
  collectionName: string;

  constructor(collectionName: string = 'CredentialManager') {
    this.collectionName = collectionName; 
    this.initDBPromise = this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    try {
      const response: InitializeMongoResponse = await initializeMongo();
      if (response.status && response.mongoDatabase) {
        this.dbConnection = response.mongoDatabase;

        const createCollectionResponse = await this.createCredentialsCollection(this.collectionName);

        if (createCollectionResponse.status) { console.log(createCollectionResponse.message) };

      } else {
        console.error('Database initialization failed:', response.message);
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error("Database initialization error:", error.message);
      throw error;
    }
  }

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
    let credentialsList: any = [];

    if (!this.dbConnection) {
      message = 'Database connection is not initialized.';
      return { status, message, credentials: credentialsList, servicesCount: 0, totalCredentials: 0, databaseName, collectionName: this.collectionName };
    }

    databaseName = this.dbConnection.databaseName;

    try {
      const dbCollection = this.dbConnection.collection(this.collectionName);
      const services = await dbCollection.find({}).toArray();

      credentialsList = services;
      const servicesCount = services.length;

      const totalCredentials = services.reduce((acc, service) => acc + service.credentials.length, 0);

      status = true;
      message = 'Loaded successfully.';
      return { status, credentials: credentialsList, message, servicesCount, totalCredentials, databaseName, collectionName: this.collectionName };
    } catch (error) {
      console.error(`Failed to load credentials: ${error}`);
      return { status, credentials: [], message: `Failed to load credentials: ${error}`, servicesCount: 0, totalCredentials: 0, databaseName, collectionName: this.collectionName };
    }
  }


  async createCredentialsCollection(collectionName: string): Promise<{ status: boolean; message: string; logMessage?: string }> {
    if (!this.dbConnection) {
      return { status: false, message: "Database connection is not initialized." };
    }

    try {
      const collections = await this.dbConnection.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
      if (collections.length === 0) {
        await this.dbConnection.createCollection(collectionName);
        return { status: true, message: `Collection '${collectionName}' created successfully.`, logMessage: `INFO: Collection '${collectionName}' was created as it did not exist.` };
      } else {
        return { status: false, message: `Collection '${collectionName}' already exists, no changes made.`, logMessage: `INFO: Collection '${collectionName}' already exists, no action required.` };
      }
    } catch (error) {
      console.error(`Failed to create or verify the '${collectionName}' collection: ${error}`);
      return { status: false, message: `Failed to create or verify the collection: ${error}` };
    }
  }

  async addService(serviceName: string): Promise<{ status: boolean; message: string }> {
    await this.ensureDBInit();

    if (!this.dbConnection) {
        return { status: false, message: "Database connection is not initialized." };
    }

    const dbCollection = this.dbConnection.collection(this.collectionName);
    
    // Assume service does not exist and proceed to add it
    await dbCollection.insertOne({ name: serviceName, credentials: [] });
    return { status: true, message: `Service '${serviceName}' added successfully to the '${this.collectionName}' collection.` };
}

  setCollectionName(newCollectionName: string): void {
    this.collectionName = newCollectionName;
  }
}

export { CredentialManager };
