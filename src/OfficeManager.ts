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
    }

    private async initializeConnection(): Promise<void> {
        const USERNAME = encodeURIComponent(this.dbUsername);
        const PASSWORD = encodeURIComponent(this.dbPassword);
        const CLUSTER = this.dbCluster;
        const URI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${this.officeName}?retryWrites=true&w=majority`;

        try {
            const mongoClient = new MongoClient(URI, {});
            await mongoClient.connect();
            this.officeDbConnection = mongoClient.db(this.officeName);
            console.log(`Connected successfully to MongoDB and to database: ${this.officeName}`);
        } catch (error:any) {
            console.error(`Failed to connect to MongoDB: ${error.message}`);
            throw error;
        }
    }

    public async ensureConnection(): Promise<void> {
        if (!this.officeDbConnection) {
            await this.initializeConnection();
        } else {
            console.log("Database connection is already established.");
        }
    }

    public async listCabinets(): Promise<string[]> {
        if (!this.officeDbConnection) {
            throw new Error("Database connection not established.");
        }

        const cabinets = await this.officeDbConnection.listCollections({}, { nameOnly: true }).toArray();
        return cabinets.map(cabinet => cabinet.name);
    }

    // Example method to add a document to a collection (Cabinet)
    public async addServiceToCabinet(cabinetName: string, serviceName: string, serviceData: object): Promise<void> {
        if (!this.officeDbConnection) {
            throw new Error("Database connection not established.");
        }

        const cabinet = this.officeDbConnection.collection(cabinetName);
        await cabinet.insertOne({ name: serviceName, ...serviceData });
        console.log(`Service '${serviceName}' added to cabinet '${cabinetName}'.`);
    }

    // You can add more methods here to manage documents within collections
}
