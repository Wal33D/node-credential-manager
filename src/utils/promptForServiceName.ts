import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { findServiceByName } from './findServiceByName';
import { createReadlineInterface } from './createReadlineInterface';

export async function promptForServiceName(credentialManager: CredentialManager, rl?: readline.Interface) {
  let readlineInterface:any = rl;
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
    const question = 'Enter the service name you want to add a credential for (or type "exit" to return to the menu): ';

    readlineInterface.question(question, async (serviceName:any) => {
      if (serviceName.toLowerCase() === "exit") {
        console.log('Exiting to main menu...');
        if (createdInternally) {
          readlineInterface.close();
        }
        resolve(null);
        return;
      }

      const val = await findServiceByName({ serviceName, dbConnection: credentialManager.dbConnection });
      if (!val.status) {
        console.log(val.message + ' Please try again.');
        resolve(await promptForServiceName(credentialManager, readlineInterface)); // Recursive call to ask again
      } else {
        if (createdInternally) {
          readlineInterface.close();
        }
        resolve(val); // Resolve with the found service
      }
    });
  });
}
