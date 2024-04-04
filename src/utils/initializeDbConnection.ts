import { Db, MongoClient } from "mongodb";

interface DbConnectionParams {
    dbUsername?: string;
    dbPassword?: string;
    dbCluster?: string;
}

interface CreateDatabaseResult {
    status: boolean;
    message: string;
}

interface ListCollectionsResult {
    status: boolean;
    message: string;
    collections?: string[];
}

interface DbOperationResult {
    status: boolean;
    message: string;
    client?: MongoClient;
    database?: Db;
    databases?: string[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const initializeDbConnection = async (params: DbConnectionParams): Promise<DbOperationResult> => {
    const { dbUsername = process.env.DB_USERNAME as string, dbPassword = process.env.DB_PASSWORD as string, dbCluster = process.env.DB_CLUSTER as string } = params;
    let message = "";
    try {
        for (let attempts = 0, maxAttempts = 5; attempts < maxAttempts; attempts++) {
            try {
                const uri = `mongodb+srv://${encodeURIComponent(dbUsername)}:${encodeURIComponent(dbPassword)}@${dbCluster}`;
                const client = new MongoClient(uri);
                await client.connect();
                return { status: true, message: "Database connection initialized successfully.", client };
            } catch (error: any) {
                message = `Attempt ${attempts + 1}: Error initializing database connection: ${error.message}`;
                if (attempts < maxAttempts - 1) await delay(1000);
            }
        }
    } catch (error: any) {
        message = `Failed to initialize database connection: ${error.message}`;
    }
    return { status: false, message };
};

export const getDatabaseConnection = async ({ dbClient, dbName }: { dbClient: MongoClient, dbName: string }): Promise<DbOperationResult> => {
    try {
        const database = dbClient.db(dbName);
        return { status: true, message: `Database '${dbName}' accessed successfully.`, database };
    } catch (error: any) {
        return { status: false, message: `Failed to access database '${dbName}': ${error.message}` };
    }
};

export const databaseExists = async ({ dbClient, dbName }: { dbClient: MongoClient, dbName: string }): Promise<DbOperationResult> => {
    try {
        await dbClient.connect();
        const dbs = await dbClient.db().admin().listDatabases();
        const exists = dbs.databases.some(db => db.name === dbName);
        const message = exists ? `Database '${dbName}' exists.` : `Database '${dbName}' does not exist.`;
        return { status: true, message, databases: dbs.databases.map(db => db.name) };
    } catch (error: any) {
        return { status: false, message: `Failed to check if database exists: ${error.message}` };
    }
};

export const listAllDatabases = async ({ dbClient }: { dbClient: MongoClient }): Promise<DbOperationResult> => {
    try {
        await dbClient.connect();
        const dbs = await dbClient.db().admin().listDatabases();
        return { status: true, message: "Successfully retrieved database list.", databases: dbs.databases.map(db => db.name) };
    } catch (error: any) {
        return { status: false, message: `Failed to list databases: ${error.message}` };
    }
};

export const createDatabase = async ({
    dbClient,
    dbName,
    collectionName
}: {
    dbClient: MongoClient,
    dbName: string,
    collectionName: string
}): Promise<CreateDatabaseResult> => {
    try {
        await dbClient.connect();
        const database = dbClient.db(dbName);
        await database.createCollection(collectionName);

        return {
            status: true,
            message: `Database '${dbName}' created successfully with collection '${collectionName}'.`
        };
    } catch (error: any) {
        return {
            status: false,
            message: `Failed to create database '${dbName}': ${error.message}`
        };
    }
};

export const listAllCollectionsInDatabase = async ({
    dbClient,
    dbName
}: {
    dbClient: MongoClient,
    dbName: string
}): Promise<ListCollectionsResult> => {
    try {
        // Ensure the client is connected
        await dbClient.connect();

        // Access the specified database
        const database = dbClient.db(dbName);

        // Use the listCollections method to get an array of collection info objects
        const collections = await database.listCollections().toArray();

        // Map the collection info objects to get an array of collection names
        const collectionNames = collections.map(collection => collection.name);

        return {
            status: true,
            message: `Successfully retrieved collections list for database '${dbName}'.`,
            collections: collectionNames,
        };
    } catch (error: any) {
        console.error(`An error occurred while listing collections in database '${dbName}': ${error.message}`);
        return {
            status: false,
            message: `Failed to list collections in database '${dbName}': ${error.message}`,
        };
    }
};
