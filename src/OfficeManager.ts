require('dotenv').config({ path: './.env.local' });

import { Db, MongoClient } from 'mongodb';

const DEFAULT_OFFICE_NAME = process.env.DEFAULT_OFFICE_NAME || "CredentialManager";

export class OfficeManager {
  officeDbConnection: Db | null = null; // Renamed for clarity
  private officeName: string;

  constructor(officeName: string = DEFAULT_OFFICE_NAME) {
    this.officeName = officeName;
  }

  /**
   * Attempts to establish a database connection, with retries and fallback to a default office name.
   */
  private async initializeConnection(): Promise<void> {
    const USERNAME = encodeURIComponent(process.env.DB_USERNAME as string);
    const PASSWORD = encodeURIComponent(process.env.DB_PASSWORD as string);
    const CLUSTER = process.env.DB_CLUSTER;
    let message = 'Initializing MongoDB connection';
    let attempts = 0;

    while (attempts < 3) {
      const URI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${this.officeName}?retryWrites=true&w=majority`;
      try {
        const mongoClient = new MongoClient(URI, {});
        await mongoClient.connect();
        this.officeDbConnection = mongoClient.db(this.officeName); // Updated variable name usage
        console.log(`Connected successfully to MongoDB and to database: ${this.officeName}`);
        return;
      } catch (error: any) {
        attempts++;
        console.error(`Attempt ${attempts}: Failed to connect to MongoDB: ${error.message}`);
        if (attempts >= 3) {
          // Attempting to connect using the default office name
          try {
            const defaultURI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${DEFAULT_OFFICE_NAME}?retryWrites=true&w=majority`;
            const mongoClient = new MongoClient(defaultURI, {});
            await mongoClient.connect();
            this.officeDbConnection = mongoClient.db(DEFAULT_OFFICE_NAME); // Updated variable name usage with default office name
            console.log(`Connected successfully to MongoDB using default database: ${DEFAULT_OFFICE_NAME}`);
            return;
          } catch (error: any) {
            console.error(`Final attempt failed: ${error.message}`);
            throw new Error(`Failed to connect to MongoDB: ${error.message}`);
          }
        }
      }
    }
  }

  /**
   * Ensures the database connection is established. If not, attempts to initialize the connection.
   */
  public async ensureConnection(): Promise<void> {
    if (!this.officeDbConnection) {
      await this.initializeConnection();
    } else {
      console.log("Database connection is already established.");
    }
  }
}
