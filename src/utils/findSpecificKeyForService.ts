import { Db } from "mongodb";
const collectionName = 'testKeys';

export const findSpecificKeyForService = async ({
  serviceName,
  keyType,
  dbConnection
}: {
  serviceName: string,
  keyType: string,
  dbConnection: Db
}) => {
  let status = false;
  let credential = null;
  let message = '';

  try {
    if (!dbConnection) {
      throw new Error('Database connection is not initialized.');
    }

    const dbCollection = dbConnection.collection(collectionName);
    // Adjusted to find a single document matching the service name directly
    const serviceDocument = await dbCollection.findOne({ name: serviceName });

    if (!serviceDocument) {
      message = `Service '${serviceName}' not found.`;
      return { status, credential, message };
    }

    // Updated to reflect new structure: keys are now under 'credentials', and their 'keyName' is now 'name'
    const key = serviceDocument.credentials.find((cred: { name: string; }) => cred.name === keyType);

    if (key) {
      status = true;
      // Updated to reflect that 'apiKey' is now 'credentials'
      credential = { name: key.name, credentials: key.credentials };
      message = `${keyType} key for service ${serviceName} retrieved successfully.`;
    } else {
      // Enhanced message hint if the key was not found
      let hint = "";
      if (keyType === "Primary" || keyType === "Secondary") {
        const alternativeKeyType = keyType === "Primary" ? "Secondary" : "Primary";
        const alternativeKey = serviceDocument.credentials.find((cred: { name: string; }) => cred.name === alternativeKeyType);
        if (alternativeKey) {
          hint = ` However, a ${alternativeKeyType} key is available.`;
        }
      }
      message = `${keyType} key for service '${serviceName}' not found.${hint}`;
    }
  } catch (error: any) {
    message = `Error: ${error.message}`;
  }

  return { status, credential, message };
};
