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
}): Promise<{ status: boolean; value?: string; serviceNameKey?: string; message: string; } | null> => {  let readlineInterface:any = rl;
  let createdInternally = false;

  if (!readlineInterface) {
    const interfaceCreationResult = createReadlineInterface();
    if (interfaceCreationResult.status) {
      readlineInterface = interfaceCreationResult.interfaceInstance;
      createdInternally = true;
    } else {
      console.error(interfaceCreationResult.message);
      return Promise.resolve(null); // Early return if readline interface creation fails
    }
  }

  return new Promise((resolve) => {
    const question = 'Enter the service name you want to add a credential for (or type "exit" to return to the menu):\n ';

    readlineInterface.question(question, async (serviceName:any) => {
      if (serviceName.toLowerCase() === "exit") {
        console.log('Exiting to main menu...');
        if (createdInternally) {
          readlineInterface.close();
        }
        resolve(null);
        return;
      }

      const findServiceByNameResult: { status: boolean; value: string; serviceNameKey: string; message: string; } = await findServiceByName({ serviceNameKey:serviceName, dbConnection: credentialManager.dbConnection });
      if (!findServiceByNameResult.status) {
        console.log(findServiceByNameResult.message + ' Please try again.');
        
        resolve(await promptForServiceName({credentialManager, rl:readlineInterface})); // Recursive call to ask again
      } else {
        if (createdInternally) {
          readlineInterface.close();
        }
        resolve(findServiceByNameResult); // Resolve with the found service
      }
    });
  });
}
