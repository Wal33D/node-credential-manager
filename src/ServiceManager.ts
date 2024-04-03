import { Db, ObjectId } from 'mongodb';

export class ServiceManager {
    private dbConnection: Db;
    public cabinetName: string;
    public credentials: { _id: ObjectId, name: string, value: any }[] = [];
    private isInitialized: boolean = false; // Flag to track initialization status

    constructor({ dbConnection, cabinetName }: { dbConnection: Db, cabinetName: string }) {
        this.dbConnection = dbConnection;
        this.cabinetName = cabinetName;
    }

    public async init(): Promise<void> {
        if (!this.isInitialized) {
            await this.loadCredentials();
            this.isInitialized = true; // Set flag to true after successful initialization
        }
    }

    private async loadCredentials(): Promise<void> {
        try {
            const docs = await this.dbConnection.collection(this.cabinetName).find({}).toArray();
            this.credentials = docs.map(doc => ({
                _id: doc._id,
                name: doc.name,
                value: doc.value
            }));
        } catch (error: any) {
            console.error(`Failed to load credentials: ${error.message}`);
        }
    }

    private async ensureInitAndExecute(action: () => Promise<any>): Promise<any> {
        await this.init(); // Ensure initialization is completed before proceeding
        return action();
    }

    public async addCredential(name: string, value: any): Promise<{ status: boolean; message: string; credentialId?: string }> {
        return this.ensureInitAndExecute(async () => {
            const result = await this.dbConnection.collection(this.cabinetName).insertOne({ name, value });
            return {
                status: true,
                message: "Credential added successfully.",
                credentialId: result.insertedId.toString(),
            };
        });
    }

    public async updateCredential(credentialId: string, value: any): Promise<{ status: boolean; message: string }> {
        return this.ensureInitAndExecute(async () => {
            const result = await this.dbConnection.collection(this.cabinetName).updateOne(
                { _id: new ObjectId(credentialId) },
                { $set: { value } }
            );

            if (result.modifiedCount === 0) {
                return { status: false, message: "No credential found with the provided ID or no changes made." };
            }

            return { status: true, message: "Credential updated successfully." };
        });
    }

    public async deleteCredential(credentialId: string): Promise<{ status: boolean; message: string }> {
        return this.ensureInitAndExecute(async () => {
            const result = await this.dbConnection.collection(this.cabinetName).deleteOne({ _id: new ObjectId(credentialId) });

            if (result.deletedCount === 0) {
                return { status: false, message: "No credential found with the provided ID." };
            }

            return { status: true, message: "Credential deleted successfully." };
        });
    }
}
