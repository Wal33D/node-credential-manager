import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';
import { ViewCredentialsResult } from "../types";

export const viewAllCredentials = async ({
  credentialManager = new CredentialManager()
}): Promise<ViewCredentialsResult> => {
  let status = false;
  let message = '';
  let credentialsMessage = '';
  let databaseName = '';
  let collectionName = '';
  let servicesCount = 0;
  let totalCredentials = 0;
  let credentials = [];

  try {
    const readlineInterfaceResult = createReadlineInterface();

    if (!readlineInterfaceResult.status) {
      throw new Error(`Failed to create readline interface: ${readlineInterfaceResult.message}`);
    }

    const result = await credentialManager.getAllCredentials();

    if (!result.status) {
      throw new Error("No credentials found.");
    }

    status = true;
    message = "Credentials fetched successfully.";
    credentialsMessage = `\nCREDENTIALS & KEYS
- Database: ${result.databaseName} | Collection: ${result.collectionName}
- Services: ${result.servicesCount} | Credentials: ${result.totalCredentials}
- Credentials: ${JSON.stringify(result.credentials, null, 2)}`;
    databaseName = result.databaseName;
    collectionName = result.collectionName;
    servicesCount = result.servicesCount;
    totalCredentials = result.totalCredentials;
    credentials = result.credentials;
  } catch (error: any) {
    message = `Error: ${error.message}`;
  }

  return {
    status,
    message,
    ...(status && {
      credentialsMessage,
      databaseName,
      collectionName,
      servicesCount,
      totalCredentials,
      credentials,
    }),
  };
};
