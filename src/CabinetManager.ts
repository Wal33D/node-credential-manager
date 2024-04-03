import { Db } from 'mongodb';
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

  public async createCabinet(newCollectionName: string): Promise<{ status: boolean; message: string }> {
    const result = await createCabinetFunction({ dbConnection: this.dbConnection, collectionName: newCollectionName });
    // Optionally update the collectionName if creation was successful and you want this instance to manage the new cabinet
    if (result.status) {
      this.collectionName = newCollectionName;
    }
    return result;
  }

  public async deleteCabinet(customCollectionName?: string): Promise<{ status: boolean; message: string }> {
    const targetCollectionName = customCollectionName || this.collectionName;
    return deleteCabinet({ dbConnection: this.dbConnection, collectionName: targetCollectionName });
  }

  public async addOrUpdateKey(recordName: string, credential: any, cabinetName?: string): Promise<{ status: boolean; message: string }> {
    const targetCabinetName = cabinetName || this.collectionName;
    const result = await insertRecordIntoCabinet({
      dbConnection: this.dbConnection,
      cabinetName: targetCabinetName,
      recordData: { name: recordName, credential },
    });

    return result;
  }
}
