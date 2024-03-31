import { Db } from 'mongodb';

export async function getAllCredentials(dbConnection: Db | null, collectionName: string): Promise<{
    status: boolean;
    credentials: any[];
    message: string;
    servicesCount: number;
    totalCredentials: number;
    databaseName: string;
    collectionName: string;
}> {
    let status = false;
    let message = '';
    let databaseName = '';
    let credentialsList: any = [];

    if (!dbConnection) {
        message = 'Database connection is not initialized.';
        return { status, message, credentials: credentialsList, servicesCount: 0, totalCredentials: 0, databaseName, collectionName };
    }

    databaseName = dbConnection.databaseName;

    try {
        const dbCollection = dbConnection.collection(collectionName);
        const services = await dbCollection.find({}).toArray();

        credentialsList = services;
        const servicesCount = services.length;

        const totalCredentials = services.reduce((acc, service) => acc + service.credentials.length, 0);

        status = true;
        message = 'Loaded successfully.';
        return { status, credentials: credentialsList, message, servicesCount, totalCredentials, databaseName, collectionName };
    } catch (error) {
        console.error(`Failed to load credentials: ${error}`);
        return { status, credentials: [], message: `Failed to load credentials: ${error}`, servicesCount: 0, totalCredentials: 0, databaseName, collectionName };
    }
}

