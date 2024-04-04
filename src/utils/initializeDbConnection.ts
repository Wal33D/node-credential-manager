import { Db, MongoClient } from "mongodb";

interface DbConnectionParams {
    dbUsername?: string;
    dbPassword?: string;
    dbCluster?: string;
}

interface OperationResult {
    status: boolean;
    message: string;
    client?: MongoClient;
    database?: Db;
    databases?: string[];
    collections?: string[];
    data?: any[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function connectWithRetry(uri: string, attempts: number = 5): Promise<MongoClient> {
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
    throw new Error("Max connection attempts exceeded.");
}

export async function initializeDbConnection(params: DbConnectionParams): Promise<OperationResult> {
    try {
        const uri = `mongodb+srv://${encodeURIComponent(params.dbUsername || process.env.DB_USERNAME as any)}:${encodeURIComponent(params.dbPassword || process.env.DB_PASSWORD as any)}@${params.dbCluster || process.env.DB_CLUSTER}`;
        const client = await connectWithRetry(uri);
        return { status: true, message: "Database connection initialized successfully.", client };
    } catch (error: any) {
        return { status: false, message: error.message };
    }
}

async function performDbOperation(operation: (client: MongoClient) => Promise<OperationResult>, dbClient: MongoClient): Promise<OperationResult> {
    try {
        return await operation(dbClient);
    } catch (error: any) {
        return { status: false, message: error.message };
    }
}

export const listAllDatabases = async (dbClient: MongoClient): Promise<OperationResult> =>
    performDbOperation(async (client) => {
        const dbs = await client.db().admin().listDatabases();
        return { status: true, message: "Successfully retrieved database list.", databases: dbs.databases.map(db => db.name) };
    }, dbClient);

export const getDatabaseConnection = (dbClient: MongoClient, dbName: string): OperationResult => ({
    status: true, message: `Database '${dbName}' accessed successfully.`, database: dbClient.db(dbName),
});

export const databaseExists = async (dbClient: MongoClient, dbName: string): Promise<OperationResult> =>
    performDbOperation(async (client) => {
        const { databases } = await listAllDatabases(client);
        const exists = databases?.includes(dbName) ?? false;
        return { status: true, message: exists ? `Database '${dbName}' exists.` : `Database '${dbName}' does not exist.` };
    }, dbClient);

export const createDatabase = async (dbClient: MongoClient, dbName: string, collectionName: string): Promise<OperationResult> =>
    performDbOperation(async (client) => {
        await client.db(dbName).createCollection(collectionName);
        return { status: true, message: `Database '${dbName}' created successfully with collection '${collectionName}'.` };
    }, dbClient);

export const listAllCollectionsInDatabase = async (dbClient: MongoClient, dbName: string): Promise<OperationResult> =>
    performDbOperation(async (client) => {
        const collections = await client.db(dbName).listCollections().toArray();
        return { status: true, message: `Successfully retrieved collections list for database '${dbName}'.`, collections: collections.map(c => c.name) };
    }, dbClient);

export const getAllDocumentsFromCollection = async (dbClient: MongoClient, dbName: string, collectionName: string): Promise<OperationResult> =>
    performDbOperation(async (client) => {
        const documents = await client.db(dbName).collection(collectionName).find({}).toArray();
        return { status: true, message: `Successfully retrieved all documents from collection '${collectionName}'.`, data: documents };
    }, dbClient);
