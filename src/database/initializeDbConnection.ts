import { MongoClient, Db } from "mongodb";

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

async function performDbOperation(operation: () => Promise<OperationResult>): Promise<OperationResult> {
    try {
        return await operation();
    } catch (error: any) {
        return { status: false, message: error.message };
    }
}

export async function initializeDbConnection(params: DbConnectionParams): Promise<OperationResult> {
    const uri = `mongodb+srv://${encodeURIComponent(params.dbUsername || process.env.DB_USERNAME as any)}:${encodeURIComponent(params.dbPassword || process.env.DB_PASSWORD as any)}@${params.dbCluster || process.env.DB_CLUSTER}`;
    return performDbOperation(async () => {
        const client = await connectWithRetry(uri);
        return { status: true, message: "Database connection initialized successfully.", client };
    });
}

export async function databaseOperation(dbClient: MongoClient, dbName: string, action: (db: any) => Promise<OperationResult>): Promise<OperationResult> {
    return performDbOperation(async () => await action(dbClient.db(dbName)));
}

export const getDatabaseConnection = (dbClient: MongoClient, dbName: string): OperationResult => ({
    status: true, message: `Database '${dbName}' accessed successfully.`, database: dbClient.db(dbName),
});

export const listAllDatabases = async (dbClient: MongoClient): Promise<OperationResult> =>
    performDbOperation(async () => {
        const dbs = await dbClient.db().admin().listDatabases();
        return { status: true, message: "Successfully retrieved database list.", databases: dbs.databases.map(db => db.name) };
    });

export const databaseExists = async (dbClient: MongoClient, dbName: string): Promise<OperationResult> =>
    databaseOperation(dbClient, "", async (client) => {
        const dbs = await client.db().admin().listDatabases();
        const exists = dbs.databases.some((db: { name: string; }) => db.name === dbName);
        return { status: true, message: exists ? `Database '${dbName}' exists.` : `Database '${dbName}' does not exist.` };
    });

export const createDatabase = async (dbClient: MongoClient, dbName: string, collectionName: string): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.createCollection(collectionName);
        return { status: true, message: `Database '${dbName}' created successfully with collection '${collectionName}'.` };
    });

export const listAllCollectionsInDatabase = (dbClient: MongoClient, dbName: string): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const collections = await db.listCollections().toArray();
        return { status: true, message: "Successfully retrieved collections list.", collections: collections.map((c: { name: any; }) => c.name) };
    });

export const getAllDocumentsFromCollection = (dbClient: MongoClient, dbName: string, collectionName: string): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const documents = await db.collection(collectionName).find({}).toArray();
        return { status: true, message: "Successfully retrieved all documents.", data: documents };
    });

export const updateDocumentsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object, update: object): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).updateMany(filter, update);
        return { status: true, message: `Updated ${result.modifiedCount} documents in '${collectionName}'.`, data: result };
    });

export const deleteDocumentsFromCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).deleteMany(filter);
        return { status: true, message: `Deleted ${result.deletedCount} documents from '${collectionName}'.`, data: result };
    });

export const findDocumentsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const documents = await db.collection(collectionName).find(filter).toArray();
        return { status: true, message: `Found documents in '${collectionName}'.`, data: documents };
    });

export const countDocumentsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const count = await db.collection(collectionName).countDocuments(filter);
        return { status: true, message: `Counted ${count} documents in '${collectionName}'.`, data: [{ count }] };
    });

export const aggregateDocumentsInCollection = (dbClient: MongoClient, dbName: string, collectionName: string, pipeline: object[]): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const documents = await db.collection(collectionName).aggregate(pipeline).toArray();
        return { status: true, message: `Aggregated documents in '${collectionName}'.`, data: documents };
    });
