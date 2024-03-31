import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';
import { ViewCredentialsResult } from "../types";

export const viewAllCredentials = async ({
  credentialManager = new CredentialManager()
}): Promise<ViewCredentialsResult> => {
  let status = false; // Explicitly declare status
  let message = '';
  let credentialsMessage = ''; // Declare credentialsMessage

  try {
    const readlineInterfaceResult = createReadlineInterface();

    if (!readlineInterfaceResult.status) {
      throw new Error(`Failed to create readline interface: ${readlineInterfaceResult.message}`);
    }

    const result = await credentialManager.getAllCredentials();

    if (!result.status) {
      throw new Error("No credentials found.");
    }

    // Preparing the credentials display message
    credentialsMessage = `\nCREDENTIALS & KEYS
- Database: ${result.databaseName} | Collection: ${result.collectionName}
- Services: ${result.servicesCount} | Credentials: ${result.totalCredentials}
- Credentials: ${JSON.stringify(result.credentials, null, 2)}`;

    // Updating the return statement to include credentialsMessage
    return {
      status: true,
      message: "Credentials fetched successfully.",
      credentialsMessage,
      databaseName: result.databaseName,
      collectionName: result.collectionName,
      servicesCount: result.servicesCount,
      totalCredentials: result.totalCredentials,
      credentials: result.credentials,
    };
  } catch (error: any) {
    message = `Error: ${error.message}`;
    // Logging the error message to maintain consistency with successful path
    console.log(message);
  }

  return { status, message };
};
