import { Db } from "mongodb";
const collectionName = 'CredentialManager';

export const findSpecificCredentialForCredential = async ({ credentialName, credentialName, dbConnection }: { credentialName: string, credentialName: string, dbConnection: Db }): Promise<{ status: boolean; credential: any;  message: string; }> => {
  let status = false;
  let credential = null;
  let message = '';

  try {
    if (!dbConnection) {
      throw new Error('Database connection is not initialized.');
    }

    const dbCollection = dbConnection.collection(collectionName);
    const credentialDocument = await dbCollection.findOne({ name: credentialName });

    if (!credentialDocument) {
      message = `Credential '${credentialName}' not found.`;
      return { status, credential, message };
    }

    const key = credentialDocument.credentials.find((cred: { name: string; }) => cred.name === credentialName);

    if (key) {
      status = true;
      credential = { name: key.name, value: key.value };
      message = `${credentialName} key for credential ${credentialName} retrieved successfully.`;
    } else {
      let hint = "";
      if (credentialName === "Primary" || credentialName === "Secondary") {
        const alternativecredentialName = credentialName === "Primary" ? "Secondary" : "Primary";
        const alternativeKey = credentialDocument.credentials.find((cred: { name: string; }) => cred.name === alternativecredentialName);
        if (alternativeKey) {
          hint = ` However, a ${alternativecredentialName} key is available.`;
        }
      }
      message = `${credentialName} key for credential '${credentialName}' not found.${hint}`;
    }
  } catch (error: any) {
    message = `Error: ${error.message}`;
  }

  return { status, credential, message };
};
