import { Db } from 'mongodb';

export const createCredentialsCollectionFunction = async ({
  dbConnection,
  collectionName,
}: {
  dbConnection: Db;
  collectionName: string;
}): Promise<{ status: boolean; existed: boolean; message: string }> => {
  let status = false;
  let message = '';
  let existed = false;

  try {
    const dbCollection = await dbConnection.listCollections({ name: collectionName }, { nameOnly: true }).toArray();
    if (dbCollection.length === 0) {
      await dbConnection.createCollection(collectionName);
      status = true;
      message = `Collection '${collectionName}' was created as it did not exist.`;
      existed = false;

    } else {
      message = `Collection '${collectionName}' already exists, no action required.`;
      status = true;
      existed = true;
    }
  } catch (error: any) {
    status = false;
    existed = false;
    message = `Failed to create or verify the '${collectionName}' collection: ${error.message}`;
  }

  return { status, existed, message };
};
