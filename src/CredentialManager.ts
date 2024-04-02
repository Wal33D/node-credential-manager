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

  constructor(collectionName: string = 'CredentialManager') {
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

  public setCollectionName(newCollectionName: string): { status: boolean; oldName: string; newName: string; message: string } {
    const oldName = this.collectionName;
    const isNameUnchanged = oldName === newCollectionName;
    const message = isNameUnchanged
        ? `Collection name is already set to '${newCollectionName}'. No changes were made.`
        : `Collection name updated successfully from '${oldName}' to '${newCollectionName}'.`;

    if (!isNameUnchanged) {
        this.collectionName = newCollectionName;
    }

    return {
        status: !isNameUnchanged,
        oldName,
        newName: this.collectionName,
        message,
    };
}

  
  public resetCollectionNameToDefault(): { status: boolean; oldName: string; newName: string; message: string; } {
    const oldName = this.collectionName;
    let message: string;
    let status: boolean = false;

    if (oldName === defaultCollectionName) {
        message = `The collection name is already set to the default '${defaultCollectionName}'. No changes were made.`;
        status = false; 
    } else {
        this.collectionName = defaultCollectionName;
        message = `Collection name reset from '${oldName}' to the default '${defaultCollectionName}'.`;
        status = true;
    }

    return {
        status,
        oldName,
        newName: this.collectionName,
        message
    };
}

}

export { CredentialManager };
