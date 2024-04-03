import { Db } from 'mongodb';
import { ServiceManager } from './ServiceManager';

export class CabinetManager {
    private officeDbConnection: Db;
    public cabinets: string[] = [];
    public cabinetName: string;
    public serviceManagers: Map<string, ServiceManager> = new Map();

    constructor({ officeDbConnection, cabinetName }: { officeDbConnection: Db, cabinetName?: string }) {
        this.officeDbConnection = officeDbConnection;
        this.cabinetName = cabinetName || process.env.DEFAULT_CABINET_NAME || 'DefaultCabinet';
        this.initializeCabinets();
    }

    private async initializeCabinets(): Promise<void> {
        try {
            this.cabinets = await this.listCabinets();

            if (!this.cabinets.includes(this.cabinetName)) {
                console.log(`Cabinet '${this.cabinetName}' not found. Creating default cabinet: '${this.cabinetName}'`);
                await this.createCabinet(this.cabinetName);
                // Ensure the cabinets list is updated immediately
                this.cabinets.push(this.cabinetName);
            }

            // Initialize ServiceManagers and wait for all to be ready
            await Promise.all(this.cabinets.map(async (cabinet) => {
                const serviceManager = new ServiceManager({ dbConnection: this.officeDbConnection, cabinetName: cabinet });
                await serviceManager.init(); // Assuming ServiceManager has an async init method
                this.serviceManagers.set(cabinet, serviceManager);
            }));

            console.log('All ServiceManagers are initialized and set.', this.serviceManagers);
        } catch (error: any) {
            console.error(`Error during cabinet initialization: ${error.message}`);
        }
    }


    public async listCabinets(): Promise<string[]> {
        if (this.cabinets.length > 0) {
            console.log(`Returning cached cabinet list: ${this.cabinets.join(', ')}`);
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
            this.cabinets = this.cabinets.filter(name => name !== cabinetName);
            return { status: true, message: `Cabinet '${cabinetName}' deleted successfully.` };
        } catch (error: any) {
            console.error(`Failed to delete cabinet '${cabinetName}': ${error.message}`);
            return { status: false, message: `Failed to delete cabinet '${cabinetName}': ${error.message}` };
        }
    }

}
