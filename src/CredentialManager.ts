require('dotenv').config({ path: './.env.local' });

import { Db } from 'mongodb';
import { initializeMongo } from './utils/initializeMongo';
import { addServiceFunction } from './functions/addServiceFunction';
import { getAllCredentialsAndStatsFunction } from './functions/getAllCredentialsAndStatsFunction';
import { createCredentialsCollectionFunction } from './functions/createCredentialsCollectionFunction';
import { deleteCredentialsCollectionFunction } from './functions/deleteCredentialsCollectionFunction';


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

  public setCollectionName(newCollectionName: string): { status: boolean; collectionName: string; message: string } {
    const nameIsUnchanged = this.collectionName === newCollectionName;
    const message = nameIsUnchanged
      ? `Collection name is already '${newCollectionName}'. No changes were made.`
      : `Collection name updated successfully from '${this.collectionName}' to '${newCollectionName}'.`;

    if (!nameIsUnchanged) {
      this.collectionName = newCollectionName;
    }

    return {
      status: !nameIsUnchanged,
      collectionName: this.collectionName,
      message,
    };
  }

  public resetCollectionNameToDefault(): { status: boolean; defaultCollectionName: string; message: string } {
    const defaultCollectionName = 'CredentialManager';
    const wasAlreadyDefault = this.collectionName === defaultCollectionName;
  
    if (!wasAlreadyDefault) {
      this.collectionName = defaultCollectionName;
    }
  
    return {
      status: !wasAlreadyDefault,
      defaultCollectionName: this.collectionName,
      message: wasAlreadyDefault
        ? `The collection name is already set to the default '${defaultCollectionName}'. No changes were made.`
        : `Collection name reset to the default '${defaultCollectionName}'.`
    };
  }
  

}

export { CredentialManager };
