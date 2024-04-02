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

  public async setAndCreateCollectionName(newCollectionName?: string): Promise<{ status: boolean; collectionName: string; wasCreated: boolean; message: string }> {
    let status = false;
    let wasCreated = false; 
    let message = '';

    try {
        if (!this.dbConnection) {
            throw new Error("Database connection is not initialized.");
        }

        const finalCollectionName = newCollectionName ?? defaultCollectionName;
        const wasAlreadySet = this.collectionName === finalCollectionName;

        if (!wasAlreadySet) {
            this.collectionName = finalCollectionName;
            const createResult = await createCredentialsCollectionFunction({
                dbConnection: this.dbConnection,
                collectionName: finalCollectionName
            });

            if (!createResult.status) {
                message = createResult.message;
            } else {
                status = true;
                wasCreated = true; 
                message = `Collection name successfully set to '${finalCollectionName}' and collection ensured in database.`;
            }
        } else {
            status = true; 
            message = `Collection name is already '${finalCollectionName}'. No changes were made.`;
        }
    } catch (error: any) {
        message = `Failed to create/switch collection: ${error.message}`;
    }

    return { status, collectionName: this.collectionName, wasCreated, message };
}

}

export { CredentialManager };
