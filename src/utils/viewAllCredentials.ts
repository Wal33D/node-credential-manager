import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';

export const viewAllCredentials = async ({ credentialManager, readLineInterface }: { credentialManager: CredentialManager, readLineInterface?: readline.Interface }): Promise<{ status: boolean; message: string; credentialsMessage?: string; credentials?: any; }> => {
  let status = false;
  let message = '';
  let credentialsMessage = '';
  let credentials = [];
  let createdInternally = false;

  try {
    if (!readLineInterface) {
      const readLineInterfaceResult = createReadlineInterface();
      if (!readLineInterfaceResult.status) {
        throw new Error(`Failed to create readline interface: ${readLineInterfaceResult.message}`);
      }
      readLineInterface = readLineInterfaceResult.interfaceInstance as readline.Interface;
      createdInternally = true;
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

  } catch (error: any) {
    message = `Error: ${error.message}`;
  } finally {
    if (createdInternally && readLineInterface) {
      readLineInterface.close();
    }
  }

  return {
    status,
    message,
    credentialsMessage,
  };
};
