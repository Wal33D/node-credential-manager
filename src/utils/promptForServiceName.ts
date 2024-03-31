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
      return Promise.resolve(null);
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
        
        resolve(await promptForServiceName({credentialManager, rl:readlineInterface}));
      } else {
        if (createdInternally) {
          readlineInterface.close();
        }
        resolve(findServiceByNameResult); 
      }
    });
  });
}
