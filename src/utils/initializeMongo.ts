import { MongoClient } from 'mongodb';
import { InitializeMongoResponse } from '../types';

const USERNAME = encodeURIComponent(process.env.DB_USERNAME as string);
const PASSWORD = encodeURIComponent(process.env.DB_PASSWORD as string);
const CLUSTER = process.env.DB_CLUSTER;
const DB_NAME = 'somnus';
const URI = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`;


export const initializeMongo = async (): Promise<InitializeMongoResponse> => {
    let status = false;
    let message = 'Initializing MongoDB connection';
    let mongoDatabase = null;

    try {
        const mongoClient = new MongoClient(URI, {});
        await mongoClient.connect();
        mongoDatabase = mongoClient.db(DB_NAME);
        message = `Connected successfully to MongoDB and to database: ${DB_NAME}`;
        status = true;
    } catch (error: any) {
        message = `Failed to connect to MongoDB: ${error.message}`;
        status = false;
    }

    return { status, mongoDatabase, message };
};
