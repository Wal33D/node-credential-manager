import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { findServiceByName } from './findServiceByName';
import { createReadlineInterface } from './createReadlineInterface';

export const promptForServiceName = async ({
  credentialManager,
  rl
}: {
  credentialManager: CredentialManager,
  rl?: readline.Interface
}): Promise<{ status: boolean; value?: string; serviceNameKey?: string; message: string; } | null> => {
  let readlineInterface: readline.Interface | any;
  let createdInternally = false;

  try {
    if (!readlineInterface) {
      const interfaceCreationResult = createReadlineInterface();
      if (interfaceCreationResult.status) {
        readlineInterface = interfaceCreationResult.interfaceInstance;
        createdInternally = true;
      } else {
        console.error(interfaceCreationResult.message);
        return null; // Early return if readline interface creation fails
      }
    }

    return new Promise((resolve) => {
      const question = 'Enter the service name you want to add a credential for (or type "exit" to return to the menu): ';

      readlineInterface.question(question, async (serviceName: string) => {
        if (serviceName.toLowerCase() === "exit") {
          console.log('Exiting to main menu...');
          if (createdInternally) {
            readlineInterface.close();
          }
          resolve(null);
          return;
        }

        const findServiceByNameResult = await findServiceByName({ serviceNameKey:serviceName, dbConnection: credentialManager.dbConnection });
        if (!findServiceByNameResult.status) {
          console.log(findServiceByNameResult.message + ' Please try again.');
          
          resolve(await promptForServiceName({ credentialManager, rl: readlineInterface })); // Recursive call to ask again
        } else {
          if (createdInternally) {
            readlineInterface.close();
          }
          resolve(findServiceByNameResult); // Resolve with the found service
        }
      });
    });
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return Promise.resolve({ status: false, message: 'An unexpected error occurred.' });
  }
};
