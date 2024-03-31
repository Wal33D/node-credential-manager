import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { findServiceByName } from './findServiceByName';
import { createReadlineInterface } from './createReadlineInterface';

export const promptForServiceName = async ({
  credentialManager,
  readLineInterface
}: {
  credentialManager: CredentialManager,
  readLineInterface?: readline.Interface
}): Promise<{ status: boolean; value?: string; serviceName?: string; message: string; } | null> => {
  let readlineInterface:any = readLineInterface;
  let createdInternally = false;

  if (!readlineInterface) {
    const interfaceCreationResult = createReadlineInterface();
    if (interfaceCreationResult.status) {
      readlineInterface = interfaceCreationResult.interfaceInstance;
      createdInternally = true;
    } else {
      console.error(interfaceCreationResult.message);
      return null;
    }
  }

  return new Promise((resolve) => {
    const question = 'Enter the service name you want to add a credential for (or type "exit" to return to the menu):\n ';

    readlineInterface.question(question, async (serviceName:string) => {
      if (serviceName.toLowerCase() === "exit") {
        console.log('Exiting to main menu...');
        resolve(null);
      } else {
        const findServiceByNameResult = await findServiceByName({ serviceName: serviceName, dbConnection: credentialManager.dbConnection });
        if (!findServiceByNameResult.status) {
          console.log(findServiceByNameResult.message + ' Please try again.');
          resolve(await promptForServiceName({credentialManager, readLineInterface: readlineInterface}));
        } else {
          resolve(findServiceByNameResult);
        }
      }
      if (createdInternally) {
        readlineInterface.close();
      }
    });
  });
}
