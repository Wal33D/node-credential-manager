import { MongoClient } from "mongodb";
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function connectWithRetry(uri: string, attempts = 5): Promise<MongoClient> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const client = new MongoClient(uri);
            await client.connect();
            return client;
        } catch (error: any) {
            if (attempt < attempts) await delay(1000 * attempt);
            else throw error;
        }
    }
    throw new Error("Connection attempts exceeded.");
}

export async function initializeDbConnection(params: any): Promise<any> {
    const uri = `mongodb+srv://${encodeURIComponent(params.dbUsername || process.env.DB_USERNAME as string)}:${encodeURIComponent(params.dbPassword || process.env.DB_PASSWORD as string)}@${params.dbCluster || process.env.DB_CLUSTER as string}`;
    try {
        const client = await connectWithRetry(uri);
        return { status: true, message: "Database connection initialized successfully.", client };
    } catch (error: any) {
        return { status: false, message: error.message };
    }
}
