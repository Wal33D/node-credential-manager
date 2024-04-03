import { Db, MongoClient } from 'mongodb';

const USERNAME = encodeURIComponent(process.env.DB_USERNAME as string);
const PASSWORD = encodeURIComponent(process.env.DB_PASSWORD as string);
const CLUSTER = process.env.DB_CLUSTER;
const DEFAULT_OFFICE_NAME = process.env.DEFAULT_COLLECTION_NAME || "CredentialManager";

export const initializeMongo = async ({ officeName }: { officeName: string }):
    Promise<{ status: boolean; databaseConnection: Db | null; message: string; }> => {
    let status = false;
    let message = 'Initializing MongoDB connection';
    let databaseConnection = null; // Renamed to clarify that this is a database connection
    let attempts = 0;

    while (attempts < 3) {
        const URI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${officeName}?retryWrites=true&w=majority`;
        try {
            const mongoClient = new MongoClient(URI, {});
            await mongoClient.connect();
            databaseConnection = mongoClient.db(officeName); // Updated variable name usage
            message = `Connected successfully to MongoDB and to database: ${officeName}`;
            status = true;
            break; // Exit the loop on success
        } catch (error: any) {
            attempts++;
            message = `Attempt ${attempts}: Failed to connect to MongoDB: ${error.message}`;
            if (attempts >= 3) {
                // Last attempt to use default office name
                try {
                    const defaultURI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${DEFAULT_OFFICE_NAME}?retryWrites=true&w=majority`;
                    const mongoClient = new MongoClient(defaultURI, {});
                    await mongoClient.connect();
                    databaseConnection = mongoClient.db(DEFAULT_OFFICE_NAME); // Updated variable name usage with default office name
                    message = `Connected successfully to MongoDB using default database: ${DEFAULT_OFFICE_NAME}`;
                    status = true;
                } catch (error: any) {
                    message = `Final attempt failed: ${error.message}`;
                    status = false;
                }
            }
        }
    }

    return { status, databaseConnection, message }; // Adjusted return to use the renamed variable
};
