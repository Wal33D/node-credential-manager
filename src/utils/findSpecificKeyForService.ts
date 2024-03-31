import { Db } from "mongodb";
const collectionName = 'CredentialManager';

export const findSpecificKeyForService = async ({
  serviceName,
  credentialName,
  dbConnection
}: {
  serviceName: string,
  credentialName: string,
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
    const key = serviceDocument.credentials.find((cred: { name: string; }) => cred.name === credentialName);

    if (key) {
      status = true;
      // Updated to reflect that 'apiKey' is now 'credentials'
      credential = { name: key.name, value: key.value };
      message = `${credentialName} key for service ${serviceName} retrieved successfully.`;
    } else {
      // Enhanced message hint if the key was not found
      let hint = "";
      if (credentialName === "Primary" || credentialName === "Secondary") {
        const alternativecredentialName = credentialName === "Primary" ? "Secondary" : "Primary";
        const alternativeKey = serviceDocument.credentials.find((cred: { name: string; }) => cred.name === alternativecredentialName);
        if (alternativeKey) {
          hint = ` However, a ${alternativecredentialName} key is available.`;
        }
      }
      message = `${credentialName} key for service '${serviceName}' not found.${hint}`;
    }
  } catch (error: any) {
    message = `Error: ${error.message}`;
  }

  return { status, credential, message };
};
