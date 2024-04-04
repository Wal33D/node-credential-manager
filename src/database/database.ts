
import { MongoClient } from "mongodb";
import { OperationResult } from "./types";
import { databaseOperation } from "./databaseOperation";
import { performDbOperation } from "./performDbOperation";

export const listDatabases = async (dbClient: MongoClient): Promise<OperationResult> =>
    performDbOperation(async () => {
        const dbs = await dbClient.db().admin().listDatabases();
        return { status: true, message: "Databases listed successfully.", databases: dbs.databases.map(db => db.name) };
    });

export const checkDatabaseExists = async (dbClient: MongoClient, dbName: string): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (client) => {
        const dbs = await client.db().admin().listDatabases();
        return { status: true, message: dbs.databases.some((db: { name: string; }) => db.name === dbName) ? `Database exists.` : `Database does not exist.` };
    });



export const dropDb = async ({ dbClient, dbName, }: { dbClient: MongoClient; dbName: string; }): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.dropDatabase();
        return { status: true, message: `Database '${dbName}' dropped.` };
    });

export const copyDb = async ({ dbClient, sourceDbName, targetDbName, }: { dbClient: MongoClient; sourceDbName: string; targetDbName: string; }): Promise<OperationResult> => {
    try {
        const sourceDb = dbClient.db(sourceDbName);
        const targetDb = dbClient.db(targetDbName);
        const collections = await sourceDb.listCollections().toArray();
        for (let collection of collections) {
            const docs = await sourceDb.collection(collection.name).find({}).toArray();
            await targetDb.collection(collection.name).insertMany(docs);
        }
        return { status: true, message: `Database copied from '${sourceDbName}' to '${targetDbName}'.` };
    } catch (error: any) {
        return { status: false, message: `Error copying database: ${error.message}` };
    }
};
