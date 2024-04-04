import { MongoClient } from "mongodb";

interface DbConnectionParams {
    dbUsername?: string;
    dbPassword?: string;
    dbCluster?: string;
}

interface OperationResult {
    status: boolean;
    message: string;
    client?: MongoClient;
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
    throw new Error("Connection attempts exceeded.");
}

export async function initializeDbConnection(params: DbConnectionParams): Promise<OperationResult> {
    const uri = `mongodb+srv://${encodeURIComponent(params.dbUsername || process.env.DB_USERNAME as string)}:${encodeURIComponent(params.dbPassword || process.env.DB_PASSWORD as string)}@${params.dbCluster || process.env.DB_CLUSTER}`;
    try {
        const client = await connectWithRetry(uri);
        return { status: true, message: "Database connection initialized successfully.", client };
    } catch (error: any) {
        return { status: false, message: error.message };
    }
}
