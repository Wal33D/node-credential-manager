import { Db } from 'mongodb';
import { addServiceFunction } from './functions/addServiceFunction';
import { getAllCredentialsAndStatsFunction } from './functions/getAllCredentialsAndStatsFunction';
import { createCabinet as createCabinetFunction } from './functions/createCabinet';
import { deleteCabinet } from './functions/deleteCabinet';
import { insertRecordIntoCabinet } from './functions/insertRecordIntoCabinet';

const DEFAULT_CABINET_NAME = process.env.DEFAULT_CABINET_NAME || "DefaultCabinet";

export class CabinetManager {
  private dbConnection: Db;
  private collectionName: string;

  constructor(dbConnection: Db, collectionName: string = DEFAULT_CABINET_NAME) {
    this.dbConnection = dbConnection;
    this.collectionName = collectionName;
  }

  public async addService(serviceName: string): Promise<{ status: boolean; message: string }> {
    return addServiceFunction({ dbConnection: this.dbConnection, collectionName: this.collectionName, serviceName });
  }

  public async getAllCredentials(): Promise<{ status: boolean; message: string; credentials: any[]; databaseName: string; collectionName: string; servicesCount: number; credentialsCount: number; }> {
    return getAllCredentialsAndStatsFunction({ dbConnection: this.dbConnection, collectionName: this.collectionName });
  }

  public async createCabinet(newCollectionName?: string): Promise<{ status: boolean; creationStatus: boolean; message: string }> {
    const result = await createCabinetFunction({ dbConnection: this.dbConnection, collectionName: this.collectionName, newCollectionName });

    if (result.status) {
      this.collectionName = result.collectionName; // Optionally update the collectionName if creation was successful
    }

    return result;
  }

  public async deleteCabinet(customCollectionName?: string): Promise<{ status: boolean; message: string }> {
    const targetCollectionName = customCollectionName || this.collectionName;
    return deleteCabinet({ dbConnection: this.dbConnection, collectionName: targetCollectionName });
  }

  public async addOrUpdateKey(recordName: string, credential: any, cabinetName?: string): Promise<{ status: boolean; recordId: string | null; message: string }> {
    const targetCabinetName = cabinetName || this.collectionName;

    return insertRecordIntoCabinet({
      dbConnection: this.dbConnection,
      cabinetName: targetCabinetName,
      recordData: { name: recordName, credential },
    });
  }
}
