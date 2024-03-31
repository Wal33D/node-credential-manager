import { Db } from 'mongodb';

export const addServiceFunction = async ({ dbConnection, collectionName, serviceName, }: { dbConnection: Db; collectionName: string; serviceName: string; }): Promise<{ status: boolean; message: string }> => {
  let status = false;
  let message = '';

  try {
    const dbCollection = dbConnection.collection(collectionName);
    await dbCollection.insertOne({ name: serviceName, credentials: [] });
    
    status = true;
    message = `Service '${serviceName}' added successfully to the '${collectionName}' collection.`;
  } catch (error: any) {
    message = `Failed to add service '${serviceName}': ${error.message}`;
  }

  return { status, message };
};
