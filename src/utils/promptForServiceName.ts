import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';
import { findServiceByName } from './findServiceByName';

export const promptForServiceName = async ({ credentialManager, readLineInterface }: { credentialManager: CredentialManager, readLineInterface?: readline.Interface }): Promise<{ status: boolean; serviceName?: string; credentials: any; message: string; }> => {
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

  const promptLoop = async (rl: readline.Interface): Promise<{ status: boolean; serviceName?: string; credentials: any; message: string; }> => {
    return new Promise((resolve) => {
      const ask = () => {
        rl.question('Enter the service name you want to search for (or type "exit" to return to the menu):\n', async (serviceName: string) => {
          if (serviceName.toLowerCase() === "exit") {
            console.log('Exiting to main menu...');
            resolve({ status: false, message: 'User exited.', credentials: [] });
            return;
          }

          const findServiceByNameResult = await findServiceByName({ serviceName: serviceName, credentialManager });
          if (!findServiceByNameResult.status) {
            console.log(findServiceByNameResult.message + ' Please try again.');
            ask(); // Re-ask the question if the service was not found or another condition is not met.
          } else {
            //message = `Service found: ${serviceName}`
            let credentials = findServiceByNameResult.credentials;

            resolve({ status: true, serviceName: serviceName, credentials, message: 'Service found.' });
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
