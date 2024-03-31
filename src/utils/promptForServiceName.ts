import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { findServiceByName } from './findServiceByName';
import { createReadlineInterface } from './createReadlineInterface';

export const promptForServiceName = async ({ credentialManager, readLineInterface }: { credentialManager: CredentialManager, readLineInterface?: readline.Interface }): Promise<{ status: boolean; value?: string; serviceName?: string; message: string; }> => {
  let readlineInterface: any = readLineInterface;
  let createdInternally = false;

  if (!readlineInterface) {
    const interfaceCreationResult = createReadlineInterface();
    if (interfaceCreationResult.status) {
      readlineInterface = interfaceCreationResult.interfaceInstance;
      createdInternally = true;
    } else {
      console.error(interfaceCreationResult.message);
      return { status: false, message: interfaceCreationResult.message };
    }
  }

  return new Promise((resolve) => {
    const question = 'Enter the service name you want to search for (or type "exit" to return to the menu):\n';

    readlineInterface.question(question, async (serviceName: string) => {
      if (serviceName.toLowerCase() === "exit") {
        console.log('Exiting to main menu...');
        resolve({ status: false, message: 'User exited.', value: '', serviceName: '' });
      } else {
        const findServiceByNameResult = await findServiceByName({ serviceName: serviceName, dbConnection: credentialManager.dbConnection });
        if (!findServiceByNameResult.status) {
          console.log(findServiceByNameResult.message + ' Please try again.');
          resolve({ status: false, message: findServiceByNameResult.message });
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
