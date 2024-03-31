import { Db } from 'mongodb';

export const getAllCredentialsFunction = async ({
  dbConnection,
  collectionName,
}: {
  dbConnection: Db | null;
  collectionName: string;
}): Promise<{
  status: boolean;
  credentials: any[];
  message: string;
  servicesCount: number;
  totalCredentials: number;
  databaseName: string;
}> => {

  let status = false;
  let message = '';
  let databaseName = '';
  let credentialsList: any = [];

  databaseName = this.dbConnection.databaseName;

  try {
    const dbCollection = this.dbConnection.collection(this.collectionName);
    const services = await dbCollection.find({}).toArray();
    credentialsList = services;
    const servicesCount = services.length;

    const totalCredentials = services.reduce((acc, service) => acc + service.credentials.length, 0);

    status = true;
    message = 'Loaded successfully.';
    return { status, credentials: credentialsList, message, servicesCount, totalCredentials, databaseName, collectionName: this.collectionName };
  } catch (error) {
    console.error(`Failed to load credentials: ${error}`);
    return { status, credentials: [], message: `Failed to load credentials: ${error}`, servicesCount: 0, totalCredentials: 0, databaseName, collectionName: this.collectionName };
  }
}
