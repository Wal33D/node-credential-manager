import { Db } from 'mongodb';
import { ServiceManager } from './ServiceManager';

export class CabinetManager {
    private officeDbConnection: Db;
    private cabinetName: string;
    private cabinets: string[] = []; // Cache for cabinet names

    constructor({ officeDbConnection, cabinetName }: { officeDbConnection: Db, cabinetName?: string }) {
        this.officeDbConnection = officeDbConnection;
        this.cabinetName = cabinetName || process.env.DEFAULT_CABINET_NAME || 'DefaultCabinet';
        this.initializeCabinets();
    }

    private async initializeCabinets(): Promise<void> {
        try {
            // Fetch and cache the list of cabinets
            this.cabinets = await this.listCabinets();
            
            // Ensure the specified or default cabinet exists
            if (!this.cabinets.includes(this.cabinetName)) {
                console.log(`Cabinet '${this.cabinetName}' not found. Creating default cabinet: '${this.cabinetName}'`);
                await this.createCabinet(this.cabinetName);
                // Refresh the cabinets list after creation
                this.cabinets.push(this.cabinetName);
            }
        } catch (error: any) {
            console.error(`Error during cabinet initialization: ${error.message}`);
        }
    }

    public async listCabinets(): Promise<string[]> {
        if (this.cabinets.length > 0) {
            return this.cabinets;
        }

        try {
            const cabinets = await this.officeDbConnection.listCollections({}, { nameOnly: true }).toArray();
            this.cabinets = cabinets.map(cabinet => cabinet.name);
            return this.cabinets;
        } catch (error: any) {
            console.error(`Failed to list cabinets: ${error.message}`);
            throw new Error(`Failed to list cabinets: ${error.message}`);
        }
    }

    public async createCabinet(cabinetName: string): Promise<{ status: boolean; message: string }> {
        try {
            if (this.cabinets.includes(cabinetName)) {
                return { status: false, message: `Cabinet '${cabinetName}' already exists.` };
            }
            await this.officeDbConnection.createCollection(cabinetName);
            // Update the cache to include the newly created cabinet
            this.cabinets.push(cabinetName);
            return { status: true, message: `Cabinet '${cabinetName}' created successfully.` };
        } catch (error: any) {
            console.error(`Failed to create cabinet '${cabinetName}': ${error.message}`);
            return { status: false, message: `Failed to create cabinet '${cabinetName}': ${error.message}` };
        }
    }

    public async deleteCabinet(cabinetName: string): Promise<{ status: boolean; message: string }> {
        try {
            if (!this.cabinets.includes(cabinetName)) {
                return { status: false, message: `Cabinet '${cabinetName}' does not exist.` };
            }
            await this.officeDbConnection.dropCollection(cabinetName);
            // Update the cache to remove the deleted cabinet
            this.cabinets = this.cabinets.filter(name => name !== cabinetName);
            return { status: true, message: `Cabinet '${cabinetName}' deleted successfully.` };
        } catch (error: any) {
            console.error(`Failed to delete cabinet '${cabinetName}': ${error.message}`);
            return { status: false, message: `Failed to delete cabinet '${cabinetName}': ${error.message}` };
        }
    }

}
