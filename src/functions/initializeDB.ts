import { Db } from 'mongodb';
import { initializeMongo } from '../utils/initializeMongo';
import { InitializeMongoResponse } from '../types';

export async function initializeDB(this: { dbConnection: Db | null }): Promise<void> {
    try {
        const response: InitializeMongoResponse = await initializeMongo();
        if (response.status && response.mongoDatabase) {
            this.dbConnection = response.mongoDatabase;
        } else {
            console.error('Database initialization failed:', response.message);
            throw new Error(response.message);
        }
    } catch (error: any) {
        console.error("Database initialization error:", error.message);
        throw error;
    }
}
