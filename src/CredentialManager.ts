require('dotenv').config({ path: './.env.local' });

import { Db } from 'mongodb';
import { initializeMongo } from './utils/initializeMongo';
import { addServiceFunction } from './functions/addServiceFunction';
import { getAllCredentialsAndStatsFunction } from './functions/getAllCredentialsAndStatsFunction';
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
    let message = '';
    let status= false;
    
    try {
      const { status:mongoDBStatus, mongoDatabase, message:initMessage } = await initializeMongo();

      if (!mongoDBStatus || !mongoDatabase) {
        message = `Database initialization failed: ${initMessage}`;
        throw new Error(message);
      }

      this.dbConnection = mongoDatabase;
      status = true;
      message = 'Database initialized successfully.';
    } catch (error: any) {
      status = false;
      message = `Database initialization error: ${error.message}`;
      throw error;
    }
  }

  public async ensureDBInit(): Promise<void> {
    await this.initDBPromise;
  }


  public async getAllCredentials(): Promise<{ status: boolean; message: string; credentials: any[]; databaseName: string; collectionName: string; servicesCount: number; totalCredentials: number; }> {

    await this.ensureDBInit();

    return getAllCredentialsAndStatsFunction({ dbConnection: this.dbConnection, collectionName: this.collectionName });
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
