require('dotenv').config({ path: './.env.local' });

import { Db } from 'mongodb';
import { initializeMongo } from './utils/initializeMongo';
import { addServiceFunction } from './functions/addServiceFunction';
import { getAllCredentialsAndStatsFunction } from './functions/getAllCredentialsAndStatsFunction';
import { createCabinet as createCabinetFunction } from './functions/createCabinet';
import { deleteCabinet } from './functions/deleteCabinet';
import { insertRecordIntoCabinet } from './functions/insertRecordIntoCabinet';

const DEFAULT_CABINET_NAME = process.env.DEFAULT_CABINET_NAME || "CredentialManager";
const DEFAULT_OFFICE_NAME = process.env.DEFAULT_CABINET_NAME || "CredentialManager";

class CredentialManager {
  dbConnection: Db | null = null;
  initDBPromise: Promise<{ status: boolean; message: string }>;
  collectionName: string;

  constructor(collectionName: string = DEFAULT_CABINET_NAME) {
    this.collectionName = collectionName;
    this.initDBPromise = this.initializeDB();
  }

  private async initializeDB(officeName: string): Promise<{ status: boolean; message: string }> {
    let message = '';
    let status = false;
  
    try {
      // Adjusted to pass 'officeName' to 'initializeMongo' and updated the destructured response variable
      const { status: mongoDBStatus, databaseConnection, message: mongoMessage } = await initializeMongo({ officeName });
      if (!mongoDBStatus) {
        // This will now properly halt the application by throwing an error if the connection fails
        throw new Error(mongoMessage || 'Failed to initialize MongoDB connection.');
      }
      this.dbConnection = databaseConnection; // Ensure this line correctly assigns the database connection
      // Assuming 'createCabinetFunction' expects a 'dbConnection'. Adjust as needed.
      const { message: credMessage } = await createCabinetFunction({ officeConnection: databaseConnection, collectionName: this.collectionName });
      status = true;
      message = `Database initialized successfully, ${credMessage}`;
    } catch (error: any) {
      status = false;
      message = `Database initialization error: ${error.message}`;
      throw new Error(message); 
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
      status = false; 
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

  public async deleteCabinet(customCollectionName?: string): Promise<{ status: boolean; message: string }> {
    await this.ensureDBInit();
    if (!this.dbConnection) {
      return { status: false, message: "Database connection is not initialized." };
    }

    const targetCollectionName = customCollectionName || this.collectionName;
    return deleteCabinet({ dbConnection: this.dbConnection, collectionName: targetCollectionName });
  }

  public async createCabinet(newCollectionName?: string): Promise<{ status: boolean; creationStatus: boolean; message: string }> {
    try {
      await this.ensureDBInit();
      if (!this.dbConnection) {
        return { status: false, creationStatus: false, message: "Database connection is not initialized." };
      }

      const result = await createCabinetFunction({ dbConnection: this.dbConnection, collectionName: this.collectionName, newCollectionName });

      if (result.status) {
        this.collectionName = result.collectionName;
      }

      return result;

    } catch (error: any) {
      return { status: false, creationStatus: false, message: `An error occurred while adding/updating the key: ${error.message}` };
    }
  }

  public async addOrUpdateKey(recordName: string, credential: any, cabinetName?: string): Promise<{ status: boolean; recordId: string|null; message: string }> {
    await this.ensureDBInit();

    if (!this.dbConnection) {
      return { status: false, recordId:null,  message: "Database connection is not initialized." };
    }

    const targetCabinetName = cabinetName || this.collectionName || DEFAULT_CABINET_NAME;

    try {
      const result = await insertRecordIntoCabinet({
        dbConnection: this.dbConnection,
        cabinetName: targetCabinetName,
        recordData: {name:recordName, credential} as any,
      });

      return result;
    } catch (error: any) {
      return { status: false, recordId:null,  message: `An error occurred while adding/updating the key: ${error.message}` };
    }
  }
}



export { CredentialManager };
