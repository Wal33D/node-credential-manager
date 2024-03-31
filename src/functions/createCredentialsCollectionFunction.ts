import { Db } from 'mongodb';

export const createCredentialsCollectionFunction = async ({
  dbConnection,
  collectionName,
}: {
  dbConnection: Db;
  collectionName: string;
}): Promise<{ status: boolean; message: string }> => {
  let status = false;
  let message = '';

  try {
    const dbCollection = await dbConnection.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
    if (dbCollection.length === 0) {
      await dbConnection.createCollection(collectionName);
      status = true;
      message = `Collection '${collectionName}' was created as it did not exist.`;
    } else {
      message = `Collection '${collectionName}' already exists, no action required.`;
      status = true; // No action needed, but operation is successful in context
    }
  } catch (error: any) {
    status = false;
    message = `Failed to create or verify the '${collectionName}' collection: ${error.message}`;
  }

  return { status, message };
};
