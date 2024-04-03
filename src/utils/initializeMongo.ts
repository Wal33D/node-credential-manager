import { Db, MongoClient } from 'mongodb';

const USERNAME = encodeURIComponent(process.env.DB_USERNAME as string);
const PASSWORD = encodeURIComponent(process.env.DB_PASSWORD as string);
const CLUSTER = process.env.DB_CLUSTER;

export const initializeMongo = async (dbName: string): Promise<{ status: boolean; mongoDatabase: Db | null; message: string; }> => {
    let status = false;
    let message = 'Initializing MongoDB connection';
    let mongoDatabase = null;
    const URI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${dbName}?retryWrites=true&w=majority`;

    try {
        const mongoClient = new MongoClient(URI, {});
        await mongoClient.connect();
        mongoDatabase = mongoClient.db(dbName);
        message = `Connected successfully to MongoDB and to database: ${dbName}`;
        status = true;
    } catch (error: any) {
        message = `Failed to connect to MongoDB: ${error.message}`;
        status = false;
    }

    return { status, mongoDatabase, message };
};
