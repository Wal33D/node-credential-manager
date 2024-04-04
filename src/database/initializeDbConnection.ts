import { MongoClient } from "mongodb";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function connectWithRetry(uri: string, attempts = 5): Promise<MongoClient> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const client = new MongoClient(uri);
            await client.connect();
            return client;
        } catch (error) {
            if (attempt < attempts) await delay(1000 * attempt);
            else throw error;
        }
    }
    throw new Error("Connection attempts exceeded.");
}

export async function performDbOperation(operation: () => Promise<any>): Promise<any> {
    try {
        return await operation();
    } catch (error: any) {
        return { status: false, message: error.message };
    }
}

export async function databaseOperation(dbClient: MongoClient, dbName: string, action: (db: any) => Promise<any>): Promise<any> {
    return performDbOperation(async () => await action(dbClient.db(dbName)));
}

export async function initializeDbConnection(params: any): Promise<any> {
    const uri = `mongodb+srv://${encodeURIComponent(params.dbUsername || process.env.DB_USERNAME as any)}:${encodeURIComponent(params.dbPassword || process.env.DB_PASSWORD as any)}@${params.dbCluster || process.env.DB_CLUSTER}`;
    return performDbOperation(async () => {
        const client = await connectWithRetry(uri);
        return { status: true, message: "Database connection initialized successfully.", client };
    });
}

export const getDatabaseConnection = (dbClient: MongoClient, dbName: string): any => ({
    status: true, message: `Database '${dbName}' accessed successfully.`, database: dbClient.db(dbName),
});
//db
export const databaseExists = async (dbClient: MongoClient, dbName: string): Promise<any> =>
    databaseOperation(dbClient, "", async (client) => {
        const dbs = await client.db().admin().listDatabases();
        const exists = dbs.databases.some((db: { name: string; }) => db.name === dbName);
        return { status: true, message: exists ? `Database '${dbName}' exists.` : `Database '${dbName}' does not exist.` };
    });

export const listAllDatabases = async (dbClient: MongoClient): Promise<any> =>
    performDbOperation(async () => {
        const dbs = await dbClient.db().admin().listDatabases();
        return { status: true, message: "Successfully retrieved database list.", databases: dbs.databases.map(db => db.name) };
    });

export const createDatabase = async (dbClient: MongoClient, dbName: string, collectionName: string): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.createCollection(collectionName);
        return { status: true, message: `Database '${dbName}' created successfully with collection '${collectionName}'.` };
    });

export const dropDatabase = async ({ dbClient, dbName, }: { dbClient: MongoClient; dbName: string; }): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.dropDatabase();
        return { status: true, message: `Database '${dbName}' dropped successfully.` };
    });

export const copyDatabase = async ({ dbClient, sourceDbName, targetDbName, }: { dbClient: MongoClient; sourceDbName: string; targetDbName: string; }): Promise<any> => {
    try {
        const sourceDb = dbClient.db(sourceDbName);
        const targetDb = dbClient.db(targetDbName);
        const collections = await sourceDb.listCollections().toArray();
        for (let collection of collections) {
            const docs = await sourceDb.collection(collection.name).find({}).toArray();
            await targetDb.collection(collection.name).insertMany(docs);
        }
        return { status: true, message: `Database '${sourceDbName}' copied to '${targetDbName}'. Proceed with dropping the source if renaming was intended.` };
    } catch (error: any) {
        return { status: false, message: `Error copying database: ${error.message}` };
    }
};

//collections
export const listCollections = async (dbClient: MongoClient, dbName: string): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const collections = await db.listCollections().toArray();
        return { status: true, message: "Collections listed successfully.", collections: collections.map((c: { name: any; }) => c.name) };
    });

export const addNewCollection = async ({ dbClient, dbName, collectionName }: { dbClient: MongoClient; dbName: string; collectionName: string; }): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.createCollection(collectionName);
        return { status: true, message: `Collection '${collectionName}' added.` };
    });

export const renameCollection = async ({ dbClient, dbName, oldCollectionName, newCollectionName, }: { dbClient: MongoClient; dbName: string; oldCollectionName: string; newCollectionName: string; }): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.collection(oldCollectionName).rename(newCollectionName);
        return { status: true, message: `Collection renamed from '${oldCollectionName}' to '${newCollectionName}'.` };
    });

export const removeCollection = async ({ dbClient, dbName, collectionName, }: { dbClient: MongoClient; dbName: string; collectionName: string; }): Promise<any> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.dropCollection(collectionName);
        return { status: true, message: `Collection '${collectionName}' removed.` };
    });
