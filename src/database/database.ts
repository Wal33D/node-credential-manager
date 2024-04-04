import { MongoClient } from "mongodb";
import { dbDatabaseOperationResponse } from "./types";

export const getDatabaseConnection = (dbClient: MongoClient, dbName: string): any => ({
    status: true, message: `Database '${dbName}' accessed successfully.`, database: dbClient.db(dbName),
});

export const databaseExists = async (dbClient: MongoClient, dbName: string): Promise<dbDatabaseOperationResponse> => {
    try {
        const dbs = await dbClient.db().admin().listDatabases();
        const exists = dbs.databases.some(db => db.name === dbName);
        return { status: true, message: exists ? `Database '${dbName}' exists.` : `Database '${dbName}' does not exist.`, dbName };
    } catch (error:any) {
        return { status: false, message: error.message, dbName };
    }
};

export const listAllDatabases = async (dbClient: MongoClient): Promise<dbDatabaseOperationResponse> => {
    try {
        const dbs = await dbClient.db().admin().listDatabases();
        return { status: true, message: "Successfully retrieved database list.", databases: dbs.databases.map(db => db.name) };
    } catch (error:any) {
        return { status: false, message: error.message };
    }
};

export const createDatabase = async (dbClient: MongoClient, dbName: string, collectionName: string): Promise<dbDatabaseOperationResponse> => {
    try {
        await dbClient.db(dbName).createCollection(collectionName);
        return { status: true, message: `Collection '${collectionName}' created in '${dbName}'.`, dbName, collectionName };
    } catch (error:any) {
        return { status: false, message: error.message, dbName, collectionName };
    }
};

export const dropDatabase = async (dbClient: MongoClient, dbName: string): Promise<dbDatabaseOperationResponse> => {
    try {
        await dbClient.db(dbName).dropDatabase();
        return { status: true, message: `Database '${dbName}' dropped successfully.`, dbName };
    } catch (error:any) {
        return { status: false, message: error.message, dbName };
    }
};

export const copyDatabase = async (dbClient: MongoClient, sourceDbName: string, targetDbName: string): Promise<dbDatabaseOperationResponse> => {
    try {
        const sourceDb = dbClient.db(sourceDbName);
        const targetDb = dbClient.db(targetDbName);
        const collections = await sourceDb.listCollections().toArray();
        for (let collection of collections) {
            const docs = await sourceDb.collection(collection.name).find({}).toArray();
            await targetDb.collection(collection.name).insertMany(docs);
        }
        return { status: true, message: `Database '${sourceDbName}' copied to '${targetDbName}'.` };
    } catch (error:any) {
        return { status: false, message: error.message };
    }
};
