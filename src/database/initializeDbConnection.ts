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

interface FindDocumentParams {
    dbClient: MongoClient;
    dbName: string;
    collectionName: string;
    documentName: string;
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

export const findDocumentByName = async ({ dbClient, dbName, collectionName, documentName, }: FindDocumentParams): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const document = await db.collection(collectionName).findOne({ name: documentName });
        return { status: !!document, message: document ? `Document with name '${documentName}' found successfully.` : `Document with name '${documentName}' not found in '${collectionName}'.`, data: document || null };
    });

export const addCollection = async ({ dbClient, dbName, collectionName }: { dbClient: MongoClient; dbName: string; collectionName: string; }): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.createCollection(collectionName);
        return { status: true, message: `Collection '${collectionName}' added to '${dbName}'.` };
    });

export const renameCollection = async ({ dbClient, dbName, oldCollectionName, newCollectionName, }: { dbClient: MongoClient; dbName: string; oldCollectionName: string; newCollectionName: string; }): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.collection(oldCollectionName).rename(newCollectionName);
        return { status: true, message: `Renamed '${oldCollectionName}' to '${newCollectionName}' in '${dbName}'.` };
    });

export const removeCollection = async ({ dbClient, dbName, collectionName, }: { dbClient: MongoClient; dbName: string; collectionName: string; }): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.dropCollection(collectionName);
        return { status: true, message: `Removed '${collectionName}' from '${dbName}'.` };
    });

export const dropDatabase = async ({ dbClient, dbName, }: { dbClient: MongoClient; dbName: string; }): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        await db.dropDatabase();
        return { status: true, message: `Database '${dbName}' dropped successfully.` };
    });

export const copyDatabase = async ({ dbClient, sourceDbName, targetDbName, }: { dbClient: MongoClient; sourceDbName: string; targetDbName: string; }): Promise<OperationResult> => {
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