import { Db, MongoClient } from 'mongodb';
import { CabinetManager } from './CabinetManager';

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
    public cabinetManagers: Map<string, CabinetManager> = new Map();

    constructor({ officeName, dbUsername, dbPassword, dbCluster }: OfficeManagerParams) {
        this.officeName = officeName;
        this.dbUsername = dbUsername;
        this.dbPassword = dbPassword;
        this.dbCluster = dbCluster;
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

                // Now we initialize the CabinetManager here
                await this.initializeCabinetManagers();
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

    private async initializeCabinetManagers(): Promise<void> {
        const cabinetNames = await this.listCabinets();

        // For each cabinet, initialize a CabinetManager and add it to the map
        cabinetNames.forEach(cabinetName => {
            const cabinetManager = new CabinetManager({ officeDbConnection: this.officeDbConnection!, cabinetName });
            this.cabinetManagers.set(cabinetName, cabinetManager);
        });

        console.log('CabinetManagers initialized for all cabinets.');
    }

    public async listCabinets(): Promise<string[]> {
        if (!this.officeDbConnection) {
            throw new Error("Database connection not established.");
        }

        const cabinets = await this.officeDbConnection.listCollections({}, { nameOnly: true }).toArray();
        return cabinets.map(cabinet => cabinet.name);
    }
}
