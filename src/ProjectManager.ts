import { Db, MongoClient } from 'mongodb';
import { AppMetadata } from './types';

interface ProjectManagerParams {
    projectName: string;
    dbUsername: string;
    dbPassword: string;
    dbCluster: string;
}

export class ProjectManager {
    projectDbConnection: Db | null = null;
    public projectName: string;
    private readonly connectionString: string;

    constructor({ projectName, dbUsername, dbPassword, dbCluster }: ProjectManagerParams) {
        this.projectName = projectName;
        this.connectionString = `mongodb+srv://${encodeURIComponent(dbUsername)}:${encodeURIComponent(dbPassword)}@${dbCluster}/${projectName}?retryWrites=true&w=majority`;
    }

    async ensureConnection(): Promise<void> {
        if (this.projectDbConnection) {
            console.log("Database connection is already established.");
            return;
        }

        try {
            const mongoClient = new MongoClient(this.connectionString);
            await mongoClient.connect();
            this.projectDbConnection = mongoClient.db(this.projectName);
            console.log(`Connected successfully to MongoDB: ${this.projectName}`);
        } catch (error: any) {
            console.error(`Failed to connect to MongoDB: ${error.message}`);
            throw error;
        }
    }

    // Method to explicitly check and create app metadata if necessary
    public async ensureAppMetadata(): Promise<void> {
        const metadataCollection = this.projectDbConnection!.collection<AppMetadata>("_appMetadata");
        if (await this.collectionExists("_appMetadata")) {
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
        const collections = await this.projectDbConnection!.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
        return collections.length > 0;
    }

    public async listCabinets(): Promise<string[]> {
        this.checkConnection();
        const cabinets = await this.projectDbConnection!.listCollections({}, { nameOnly: true }).toArray();
        return cabinets.map(cabinet => cabinet.name);
    }

    public async addCredentialToCabinet(cabinetName: string, credentialData: Credential): Promise<void> {
        this.checkConnection();
        const now = new Date();
        // Ensure createdAt is set
        const dataWithTimestamp = { ...credentialData, createdAt: credentialData.createdAt || now };
        await this.projectDbConnection!.collection(cabinetName).insertOne(dataWithTimestamp);
        console.log(`Credential '${credentialData.name}' added to cabinet '${cabinetName}'.`);
    }

    private checkConnection(): void {
        if (!this.projectDbConnection) throw new Error("Database connection not established.");
    }
}


// If you're adding it to your existing 'types' module
import { ObjectId } from 'mongodb';

export interface Credential {
    _id?: ObjectId; // Assuming you want to include the MongoDB ObjectId for the credential
    name: string; // Name of the credential, assuming it's what you referred to as serviceName
    envName: string; // Environment name for the credential
    envVariableName:string;
    createdAt: Date; // Creation date for the credential
    // Add other fields as necessary
    [key: string]: any; // To allow for flexibility with additional data
}
