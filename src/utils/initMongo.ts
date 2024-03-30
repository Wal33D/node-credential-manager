import { MongoClient } from 'mongodb';

const USERNAME = encodeURIComponent(process.env.DB_USERNAME as string);
const PASSWORD = encodeURIComponent(process.env.DB_PASSWORD as string);
const CLUSTER = process.env.DB_CLUSTER;
const DB_NAME = 'somnus'; // Using the specific database name directly
const URI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`;

let client: any;
let database: any;

export const initializeMongo = async () => {
    if (!client || !client.isConnected()) {
        client = new MongoClient(URI, {
            //@ts-ignore
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        try {
            await client.connect();
            console.log('Connected successfully to MongoDB');

            // If a specific environment name is provided, use it; otherwise, default to SOMNUS_DBNAME
            const dbName = DB_NAME;
            database = client.db(dbName);
            console.log(`Connected successfully to database: ${dbName}`);

            return database;
        } catch (err) {
            console.error('Failed to connect to MongoDB:', err);
            throw err;
        }
    } else {
        console.log('Using existing MongoDB connection');
        return database;
    }
};
