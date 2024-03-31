require('dotenv').config({ path: './.env.local' });

import { Db } from 'mongodb';
import { initializeMongo } from './utils/initializeMongo';
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
      console.log(JSON.stringify(credentials, null, 2));

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
