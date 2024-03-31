require('dotenv').config({ path: './.env.local' });

import { Db } from 'mongodb';
import { initializeMongo } from './utils/initializeMongo';
import { addServiceFunction } from './functions/addServiceFunction';
import { getAllCredentialsFunction } from './functions/getAllCredentialsFunction';
import { createCredentialsCollectionFunction } from './functions/createCredentialsCollectionFunction';

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
      const { status, mongoDatabase, message } = await initializeMongo();
      if (!status || !mongoDatabase) {
        console.error('Database initialization failed:', message);
        throw new Error(message);
      }
      
      this.dbConnection = mongoDatabase;
      
      const createCollectionResponse = await createCredentialsCollectionFunction({
        dbConnection: this.dbConnection,
        collectionName: this.collectionName
      });
  
      if (!createCollectionResponse.status) {
        console.error('Creating credentials collection failed:', createCollectionResponse.message);
        throw new Error(createCollectionResponse.message);
      }
      
      console.log(createCollectionResponse.message);
    } catch (error: any) {
      console.error("Database initialization error:", error.message);
      throw error;
    }
  }
  
  public async ensureDBInit(): Promise<void> {
    await this.initDBPromise;
  }


  public async getAllCredentials(): Promise<{ status: boolean; message: string; credentials: any[]; databaseName: string; collectionName: string; servicesCount: number; totalCredentials: number; }> {

    await this.ensureDBInit();

    return getAllCredentialsFunction({ dbConnection: this.dbConnection, collectionName: this.collectionName });
  }

  public async addService(serviceName: string): Promise<{ status: boolean; message: string }> {

    await this.ensureDBInit();

    return addServiceFunction({ dbConnection: this.dbConnection as any, collectionName: this.collectionName, serviceName });
  }

  public async createCredentialsCollection(customCollectionName: string): Promise<{ status: boolean; message: string }> {
    await this.ensureDBInit();

    if (!this.dbConnection) {
      return { status: false, message: "Database connection is not initialized." };
    }

    const targetCollectionName = customCollectionName || this.collectionName;

    return createCredentialsCollectionFunction({
      dbConnection: this.dbConnection,
      collectionName: targetCollectionName,
    });
  }


}

export { CredentialManager };
