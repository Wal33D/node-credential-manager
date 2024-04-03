import { Db } from 'mongodb';

export const getAllCredentialsAndStatsFunction = async ({
  dbConnection,
  collectionName,
}: {
  dbConnection: Db | null;
  collectionName: string;
}): Promise<{
  status: boolean;
  credentials: any[];
  databaseName: string;
  credentialsCount: number;
  collectionName: string;
  credentialsCount: number;
  message: string;
}> => {

  let status = false;
  let message = '';
  let databaseName = '';
  let credentialsList: any = [];

  databaseName = dbConnection?.databaseName as string;

  try {
    const dbCollection = dbConnection?.collection(collectionName) as any;
    const credentials = await dbCollection.find({}).toArray();
    credentialsList = credentials;
    const credentialsCount = credentials.length;

    const credentialsCount = credentials.reduce((acc: any, credential: { credentials: string | any[]; }) => acc + credential.credentials.length, 0);

    status = true;
    message = 'Loaded successfully.';
    return { status, credentials: credentialsList, message, credentialsCount, credentialsCount, databaseName, collectionName };
  } catch (error) {
    console.error(`Failed to load credentials: ${error}`);
    return { status, credentials: [], message: `Failed to load credentials: ${error}`, credentialsCount: 0, credentialsCount: 0, databaseName, collectionName };
  }
}
