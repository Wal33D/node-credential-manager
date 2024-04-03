require('dotenv').config({ path: './.env.local' });

import { Db, MongoClient } from 'mongodb';

const DEFAULT_OFFICE_NAME = process.env.DEFAULT_OFFICE_NAME || "CredentialManager";

export class ProjectManager {
  projectDbConnection: Db | null = null;
  private projectName: string;

  constructor(projectName: string = DEFAULT_OFFICE_NAME) {
    this.projectName = projectName;
  }

  /**
   * Attempts to establish a database connection, with retries and fallback to a default project name.
   */
  private async initializeConnection(): Promise<void> {
    const USERNAME = encodeURIComponent(process.env.DB_USERNAME as string);
    const PASSWORD = encodeURIComponent(process.env.DB_PASSWORD as string);
    const CLUSTER = process.env.DB_CLUSTER;
    let message = 'Initializing MongoDB connection';
    let attempts = 0;

    while (attempts < 3) {
      const URI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${this.projectName}?retryWrites=true&w=majority`;
      try {
        const mongoClient = new MongoClient(URI, {});
        await mongoClient.connect();
        this.projectDbConnection = mongoClient.db(this.projectName); // Updated variable name usage
        console.log(`Connected successfully to MongoDB and to database: ${this.projectName}`);
        return;
      } catch (error: any) {
        attempts++;
        console.error(`Attempt ${attempts}: Failed to connect to MongoDB: ${error.message}`);
        if (attempts >= 3) {
          // Attempting to connect using the default project name
          try {
            const defaultURI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${DEFAULT_OFFICE_NAME}?retryWrites=true&w=majority`;
            const mongoClient = new MongoClient(defaultURI, {});
            await mongoClient.connect();
            this.projectDbConnection = mongoClient.db(DEFAULT_OFFICE_NAME); // Updated variable name usage with default project name
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
    if (!this.projectDbConnection) {
      await this.initializeConnection();
    } else {
      console.log("Database connection is already established.");
    }
  }
}
