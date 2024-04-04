import { MongoClient, Db } from "mongodb";

export async function performDatabaseOperation(dbClient: MongoClient, dbName: string, action: (db: Db) => Promise<any>): Promise<any> {
    try {
        const db = dbClient.db(dbName);
        return await action(db);
    } catch (error: any) {
        return { status: false, message: error.message };
    }
}