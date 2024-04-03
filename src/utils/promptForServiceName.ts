import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';
import { findCredentialByName } from './findCredentialByName';

export const promptForCredentialName = async ({ credentialManager, readLineInterface }: { credentialManager: CredentialManager, readLineInterface?: readline.Interface }): Promise<{ status: boolean; credentialName?: string; credentials: any; message: string; }> => {
  let createdInternally = false;

  if (!readLineInterface) {
    const interfaceCreationResult = createReadlineInterface();
    if (interfaceCreationResult.status) {
      readLineInterface = interfaceCreationResult.interfaceInstance as any;
      createdInternally = true;
    } else {
      console.error(interfaceCreationResult.message);
      return { status: false, message: interfaceCreationResult.message, credentials: [] };
    }
  }

  const promptLoop = async (rl: readline.Interface): Promise<{ status: boolean; credentialName?: string; credentials: any; message: string; }> => {
    return new Promise((resolve) => {
      const ask = () => {
        rl.question('Enter the credential name you want to search for (or type "exit" to return to the menu):\n', async (credentialName: string) => {
          if (credentialName.toLowerCase() === "exit") {
            console.log('Exiting to main menu...');
            resolve({ status: false, message: 'User exited.', credentials: [] });
            return;
          }

          const findCredentialByNameResult = await findCredentialByName({ credentialName: credentialName, credentialManager });
          if (!findCredentialByNameResult.status) {
            console.log(findCredentialByNameResult.message + ' Please try again.');
            ask(); // Re-ask the question if the credential was not found or another condition is not met.
          } else {
            //message = `Credential found: ${credentialName}`
            let credentials = findCredentialByNameResult.credentials;

            resolve({ status: true, credentialName: credentialName, credentials, message: 'Credential found.' });
          }
        });
      };

      ask(); // Initial askcredentials
    });
  };

  const result = await promptLoop(readLineInterface as any);

  if (createdInternally && readLineInterface) {
    readLineInterface.close();
  }

  return result;
};
