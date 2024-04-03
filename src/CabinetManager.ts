import { Db } from 'mongodb';
import { ServiceManager } from './ServiceManager'; // Ensure this path is correct

export class CabinetManager {
    private officeDbConnection: Db;
    private defaultCabinetName: string = process.env.DEFAULT_CABINET_NAME || 'DefaultCabinet';
    
    constructor({ officeDbConnection }: { officeDbConnection: Db }) {
        this.officeDbConnection = officeDbConnection;
        this.ensureDefaultCabinet();
    }

    // Ensures the existence of the default cabinet if no other cabinets exist
    private async ensureDefaultCabinet(): Promise<void> {
        (async () => {
            try {
                const cabinets = await this.listCabinets();
                if (cabinets.length === 0) {
                    console.log(`No cabinets found in the office. Creating default cabinet: '${this.defaultCabinetName}'`);
                    await this.createCabinet(this.defaultCabinetName);
                }
            } catch (error: any) {
                console.error(`Error ensuring the default cabinet: ${error.message}`);
            }
        })();
    }

    // Lists all cabinets (collections) within the office (database)
    public async listCabinets(): Promise<string[]> {
        try {
            const cabinets = await this.officeDbConnection.listCollections({}, { nameOnly: true }).toArray();
            return cabinets.map(cabinet => cabinet.name);
        } catch (error: any) {
            console.error(`Failed to list cabinets: ${error.message}`);
            throw new Error(`Failed to list cabinets: ${error.message}`);
        }
    }

    // Creates a new cabinet (collection) if it does not already exist
    public async createCabinet(cabinetName: string): Promise<{ status: boolean; message: string }> {
        try {
            const cabinets = await this.listCabinets();
            if (cabinets.includes(cabinetName)) {
                return { status: false, message: `Cabinet '${cabinetName}' already exists.` };
            }
            await this.officeDbConnection.createCollection(cabinetName);
            return { status: true, message: `Cabinet '${cabinetName}' created successfully.` };
        } catch (error: any) {
            console.error(`Failed to create cabinet '${cabinetName}': ${error.message}`);
            return { status: false, message: `Failed to create cabinet '${cabinetName}': ${error.message}` };
        }
    }

    // Deletes an existing cabinet (collection) if it exists
    public async deleteCabinet(cabinetName: string): Promise<{ status: boolean; message: string }> {
        try {
            const cabinets = await this.listCabinets();
            if (!cabinets.includes(cabinetName)) {
                return { status: false, message: `Cabinet '${cabinetName}' does not exist.` };
            }
            await this.officeDbConnection.dropCollection(cabinetName);
            return { status: true, message: `Cabinet '${cabinetName}' deleted successfully.` };
        } catch (error: any) {
            console.error(`Failed to delete cabinet '${cabinetName}': ${error.message}`);
            return { status: false, message: `Failed to delete cabinet '${cabinetName}': ${error.message}` };
        }
    }
    public getServiceManager(cabinetName: string): ServiceManager {
        // Ensures that the requested cabinet exists before returning a ServiceManager for it
        return new ServiceManager(this.officeDbConnection, cabinetName);
    }
}
