require('dotenv').config({ path: './.env.local' });

import { Db } from 'mongodb';
import { initializeMongo } from './utils/initializeMongo';
import { addServiceFunction } from './functions/addServiceFunction';
import { getAllCredentialsAndStatsFunction } from './functions/getAllCredentialsAndStatsFunction';
import { createCabinet } from './functions/createCabinet';
import { deleteCredentialsCollectionFunction } from './functions/deleteCredentialsCollectionFunction';

const defaultCollectionName = 'CredentialManager';

class CredentialManager {
  dbConnection: Db | null = null;
  initDBPromise: Promise<{ status: boolean; message: string }>;
  collectionName: string;

  constructor(collectionName: string = defaultCollectionName) {
    this.collectionName = collectionName;
    this.initDBPromise = this.initializeDB();
  }

  private async initializeDB(): Promise<{ status: boolean; message: string }> {
    let message = '';
    let status = false;

    try {
      const { status: mongoDBStatus, mongoDatabase } = await initializeMongo();
      if (!mongoDBStatus) {
        throw new Error('Failed to initialize MongoDB connection.');
      }
      this.dbConnection = mongoDatabase;
      const { message: credMessage } = await createCabinet({ dbConnection: mongoDatabase as any, collectionName: this.collectionName, defaultCollectionName });
      status = true;
      message = `Database initialized successfully, ${credMessage}`;
    } catch (error: any) {
      status = false;
      message = `Database initialization error: ${error.message}`;
    }
    return { status, message };
  }

  public async ensureDBInit(): Promise<{ status: boolean; message: string }> {
    let status = false;
    let message = '';

    try {
      await this.initDBPromise;
      if (!this.dbConnection) {
        throw new Error("Database connection is not initialized.");
      }
      status = true;
      message = "Database connection is initialized.";
    } catch (error: any) {
      message = `Error: ${error.message}`;
    }

    return { status, message };
  }

  public async getAllCredentials(): Promise<{ status: boolean; message: string; credentials: any[]; databaseName: string; collectionName: string; servicesCount: number; credentialsCount: number; }> {
    await this.ensureDBInit();
    return getAllCredentialsAndStatsFunction({ dbConnection: this.dbConnection, collectionName: this.collectionName });
  }

  public async addService(serviceName: string): Promise<{ status: boolean; message: string }> {
    await this.ensureDBInit();
    return addServiceFunction({ dbConnection: this.dbConnection as Db, collectionName: this.collectionName, serviceName });
  }


  public async deleteCredentialsCollection(customCollectionName?: string): Promise<{ status: boolean; message: string }> {
    await this.ensureDBInit();
    if (!this.dbConnection) {
      return { status: false, message: "Database connection is not initialized." };
    }

    const targetCollectionName = customCollectionName || this.collectionName;
    return deleteCredentialsCollectionFunction({ dbConnection: this.dbConnection, collectionName: targetCollectionName });
  }


  public async createCabinet(newCollectionName?: string): Promise<{ status: boolean; creationStatus: boolean; message: string }> {
    await this.ensureDBInit();

    if (!this.dbConnection) {
      return { status: false, creationStatus: false, message: "Database connection is not initialized." };
    }
    const result = await createCabinet({
      dbConnection: this.dbConnection,
      collectionName: this.collectionName,
      newCollectionName,
      defaultCollectionName
    });

    if (result.status) {
      this.collectionName = result.collectionName;
    }
    return result;
  }
}

export { CredentialManager };
