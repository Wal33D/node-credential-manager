import { Db, MongoClient } from "mongodb";

interface DbConnectionParams {
    dbUsername?: string;
    dbPassword?: string;
    dbCluster?: string;
}

interface DbConnectionResult {
    status: boolean;
    message: string;
    client?: MongoClient;
}

interface GetDatabaseConnectionResult {
    status: boolean;
    message: string;
    database?: Db;
}

export const initializeDbConnection = async ({
    dbUsername = process.env.DB_USERNAME as string,
    dbPassword = process.env.DB_PASSWORD as string,
    dbCluster = process.env.DB_CLUSTER as string,
}: DbConnectionParams = {}): Promise<DbConnectionResult> => {
    let status = false;
    let message = "";
    let client: MongoClient | undefined;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        try {
            const uri = `mongodb+srv://${encodeURIComponent(dbUsername)}:${encodeURIComponent(dbPassword)}@${dbCluster}`;
            client = new MongoClient(uri);
            await client.connect();
            status = true;
            message = "Database connection initialized successfully.";
            break;
        } catch (error: any) {
            attempts++;
            message = `Attempt ${attempts}: Error initializing database connection: ${error.message}`;
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    if (!status) {
        message = `Failed to initialize database connection after ${maxAttempts} attempts.`;
    }

    return { status, message, client };
};

export const getDatabaseConnection = async ({
    dbClient,
    dbName
}: {
    dbClient: MongoClient,
    dbName: string
}): Promise<GetDatabaseConnectionResult> => {
    try {
        const database = dbClient.db(dbName);

        return {
            status: true,
            message: `Database '${dbName}' accessed successfully.`,
            database
        };
    } catch (error: any) {
        return {
            status: false,
            message: `Failed to access database '${dbName}': ${error.message}`
        };
    }
};

interface DatabaseExistsResult {
    exists: boolean;
    message: string;
}

export const checkIfDatabaseExists = async ({
    dbClient,
    dbName
}: {
    dbClient: MongoClient,
    dbName: string
}): Promise<DatabaseExistsResult> => {
    try {
        await dbClient.connect();

        const adminDb = dbClient.db("admin");
        const { databases } = await adminDb.admin().listDatabases();
        
        const databaseExists = databases.some(database => database.name === dbName);

        return {
            exists: databaseExists,
            message: databaseExists ? `Database '${dbName}' exists.` : `Database '${dbName}' does not exist.`
        };
    } catch (error: any) {
        return {
            exists: false,
            message: `Error checking database existence: ${error.message}`
        };
    }
};

