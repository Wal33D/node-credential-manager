import { Db, MongoClient } from 'mongodb';

interface OfficeManagerParams {
    officeName: string;
    dbUsername: string;
    dbPassword: string;
    dbCluster: string;
}

export class OfficeManager {
    officeDbConnection: Db | null = null;
    public officeName: string;
    private dbUsername: string;
    private dbPassword: string;
    private dbCluster: string;

    constructor({ officeName, dbUsername, dbPassword, dbCluster }: OfficeManagerParams) {
        this.officeName = officeName;
        this.dbUsername = dbUsername;
        this.dbPassword = dbPassword;
        this.dbCluster = dbCluster;
        this.initializeConnection();
    }

    private async initializeConnection(): Promise<void> {
        const USERNAME = encodeURIComponent(this.dbUsername);
        const PASSWORD = encodeURIComponent(this.dbPassword);
        const CLUSTER = this.dbCluster;

        let attempts = 0;
        const URI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${this.officeName}?retryWrites=true&w=majority`;

        while (attempts < 3) {
            try {
                const mongoClient = new MongoClient(URI, {});
                await mongoClient.connect();
                this.officeDbConnection = mongoClient.db(this.officeName);
                console.log(`Connected successfully to MongoDB and to database: ${this.officeName}`);
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


}
