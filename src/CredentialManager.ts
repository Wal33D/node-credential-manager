require('dotenv').config({ path: './.env.local' });

import { Db } from 'mongodb';
import { initializeMongo } from './utils/initializeMongo';
import { addServiceFunction } from './functions/addServiceFunction';
import { getAllCredentialsAndStatsFunction } from './functions/getAllCredentialsAndStatsFunction';
import { createCredentialsCollectionFunction } from './functions/createCredentialsCollectionFunction';
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
      const { message: credMessage } = await createCredentialsCollectionFunction({ dbConnection: mongoDatabase as any, collectionName: this.collectionName });
      status = true;
      message = `Database initialized successfully, ${credMessage}`;
    } catch (error: any) {
      status = false;
      message = `Database initialization error: ${error.message}`;
    }
    return { status, message };
  }

  public async ensureDBInit(): Promise<void> {
    await this.initDBPromise;
  }

  public async getAllCredentials(): Promise<{ status: boolean; message: string; credentials: any[]; databaseName: string; collectionName: string; servicesCount: number; credentialsCount: number; }> {
    await this.ensureDBInit();
    return getAllCredentialsAndStatsFunction({ dbConnection: this.dbConnection, collectionName: this.collectionName });
  }

  public async addService(serviceName: string): Promise<{ status: boolean; message: string }> {
    await this.ensureDBInit();
    return addServiceFunction({ dbConnection: this.dbConnection as Db, collectionName: this.collectionName, serviceName });
  }

  public async createCredentialsCollection(customCollectionName: string): Promise<{ status: boolean; message: string }> {
    await this.ensureDBInit();
    if (!this.dbConnection) {
      return { status: false, message: "Database connection is not initialized." };
    }
    const targetCollectionName = customCollectionName || this.collectionName;

    return createCredentialsCollectionFunction({ dbConnection: this.dbConnection, collectionName: targetCollectionName, });
  }

  public async deleteCredentialsCollection(customCollectionName?: string): Promise<{ status: boolean; message: string }> {
    await this.ensureDBInit();
    if (!this.dbConnection) {
      return { status: false, message: "Database connection is not initialized." };
    }

    const targetCollectionName = customCollectionName || this.collectionName;
    return deleteCredentialsCollectionFunction({ dbConnection: this.dbConnection, collectionName: targetCollectionName });
  }

  public setCollectionName(newCollectionName?: string): { status: boolean; collectionName: string; message: string } {
    const finalCollectionName = newCollectionName ?? defaultCollectionName;
    const wasAlreadySet = this.collectionName === finalCollectionName;
    const action = newCollectionName ? 'updated' : 'reset';
    const messagePrefix = wasAlreadySet ? 'already' : 'successfully';
  
    if (!wasAlreadySet) {
      this.collectionName = finalCollectionName;
    }
  
    return {
      status: !wasAlreadySet,
      collectionName: this.collectionName,
      message: `Collection name ${messagePrefix} ${action} to '${finalCollectionName}'.` + (wasAlreadySet ? " No changes were made." : "")
    };
  }
  
}

export { CredentialManager };
