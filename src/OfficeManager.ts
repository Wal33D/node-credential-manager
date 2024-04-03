import { Db, MongoClient } from 'mongodb';
import { AppMetadata } from './types';

interface OfficeManagerParams {
    officeName: string;
    dbUsername: string;
    dbPassword: string;
    dbCluster: string;
}

export class OfficeManager {
    officeDbConnection: Db | null = null;
    public officeName: string;
    private readonly connectionString: string;

    constructor({ officeName, dbUsername, dbPassword, dbCluster }: OfficeManagerParams) {
        this.officeName = officeName;
        this.connectionString = `mongodb+srv://${encodeURIComponent(dbUsername)}:${encodeURIComponent(dbPassword)}@${dbCluster}/${officeName}?retryWrites=true&w=majority`;
    }

    async ensureConnection(): Promise<void> {
        if (this.officeDbConnection) {
            console.log("Database connection is already established.");
            return;
        }

        try {
            const mongoClient = new MongoClient(this.connectionString);
            await mongoClient.connect();
            this.officeDbConnection = mongoClient.db(this.officeName);
            console.log(`Connected successfully to MongoDB: ${this.officeName}`);
            await Promise.all([this.ensureDefaultCollectionExists(), this.ensureAppMetadata()]);
        } catch (error: any) {
            console.error(`Failed to connect to MongoDB: ${error.message}`);
            throw error;
        }
    }

    private async ensureDefaultCollectionExists(): Promise<void> {
        if (await this.collectionExists(process.env.DEFAULT_CABINET_NAME || "DefaultCollection")) return;
        await this.officeDbConnection!.createCollection(process.env.DEFAULT_CABINET_NAME || "DefaultCollection");
        console.log(`Default collection created in database: ${this.officeName}`);
    }

    private async ensureAppMetadata(): Promise<void> {
        const metadataCollection = this.officeDbConnection!.collection<AppMetadata>("_appMetadata");

        const exists = await this.collectionExists("_appMetadata");
        if (exists) {
            // Assuming you'd update the existing document's updatedAt here in a real scenario
            console.log("App metadata already exists.");
            return;
        }

        const now = new Date();
        await metadataCollection.insertOne({
            application: "CredentialManager",
            description: "Metadata for CredentialManager application.",
            createdAt: now,
            updatedAt: now,
            lastAccessed: now 
        });

        console.log("Application metadata collection created.");
    }

    public async collectionExists(collectionName: string): Promise<boolean> {
        const collections = await this.officeDbConnection!.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
        return collections.length > 0;
    }

    public async listCabinets(): Promise<string[]> {
        this.checkConnection();
        const cabinets = await this.officeDbConnection!.listCollections({}, { nameOnly: true }).toArray();
        return cabinets.map(cabinet => cabinet.name);
    }

    public async addServiceToCabinet(cabinetName: string, serviceName: string, serviceData: object): Promise<void> {
        this.checkConnection();
        await this.officeDbConnection!.collection(cabinetName).insertOne({ name: serviceName, ...serviceData });
        console.log(`Service '${serviceName}' added to cabinet '${cabinetName}'.`);
        await this.updateAppMetadataAccess();
    }

    private checkConnection(): void {
        if (!this.officeDbConnection) throw new Error("Database connection not established.");
    }
    private async updateAppMetadataAccess(): Promise<void> {
        const now = new Date();
        const metadataCollection = this.officeDbConnection!.collection<AppMetadata>("_appMetadata");

        // Update the metadata document with new updatedAt and lastAccessed values
        await metadataCollection.updateOne({}, { $set: { updatedAt: now, lastAccessed: now } });
        console.log("App metadata updated.");
    }
}
