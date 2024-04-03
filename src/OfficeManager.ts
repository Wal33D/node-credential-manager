require('dotenv').config({ path: './.env.local' });

import { Db, MongoClient } from 'mongodb';

const DEFAULT_OFFICE_NAME = process.env.DEFAULT_OFFICE_NAME || "CredentialManager";
const DEFAULT_CABINET_NAME = "DefaultCabinet"; 

export class OfficeManager {
  officeDbConnection: Db | null = null;
  private officeName: string;

  constructor(officeName: string = DEFAULT_OFFICE_NAME) {
    this.officeName = officeName;
  }

  private async initializeConnection(): Promise<void> {
    const USERNAME = encodeURIComponent(process.env.DB_USERNAME as string);
    const PASSWORD = encodeURIComponent(process.env.DB_PASSWORD as string);
    const CLUSTER = process.env.DB_CLUSTER;
    
    let attempts = 0;
    while (attempts < 3) {
      const URI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${this.officeName}?retryWrites=true&w=majority`;
      try {
        const mongoClient = new MongoClient(URI, {});
        await mongoClient.connect();
        this.officeDbConnection = mongoClient.db(this.officeName);
        console.log(`Connected successfully to MongoDB and to database: ${this.officeName}`);
        // After establishing the connection, ensure the default cabinet exists
        await this.ensureCabinet(DEFAULT_CABINET_NAME);
        return;
      } catch (error: any) {
        attempts++;
        console.error(`Attempt ${attempts}: Failed to connect to MongoDB: ${error.message}`);
        if (attempts >= 3) {
          console.error(`Final attempt failed: ${error.message}`);
          throw new Error(`Failed to connect to MongoDB: ${error.message}`);
        }
      }
    }
  }

  public async ensureConnection(): Promise<void> {
    if (!this.officeDbConnection) {
      await this.initializeConnection();
    } else {
      console.log("Database connection is already established.");
    }
  }

  public async ensureCabinet(cabinetName: string): Promise<void> {
    if (!this.officeDbConnection) {
      console.error("No database connection established.");
      return;
    }

    const cabinets = await this.officeDbConnection.listCollections({ name: cabinetName }, { nameOnly: true }).toArray();
    if (cabinets.length === 0) {
      console.log(`Creating cabinet: ${cabinetName}`);
      await this.officeDbConnection.createCollection(cabinetName);
    } else {
      console.log(`Cabinet '${cabinetName}' already exists.`);
    }
  }

  public async createCabinet(cabinetName: string): Promise<{ status: boolean; message: string }> {
    try {
      await this.ensureCabinet(cabinetName);
      return { status: true, message: `Cabinet '${cabinetName}' created or already exists.` };
    } catch (error) {
      console.error(`Error creating cabinet '${cabinetName}': ${error.message}`);
      return { status: false, message: `Failed to create cabinet '${cabinetName}': ${error.message}` };
    }
  }
}
