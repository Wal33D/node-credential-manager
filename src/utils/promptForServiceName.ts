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
  let readlineInterface: any = readLineInterface;
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

  // Define a loop control variable
  let continueApp = true;

  while (continueApp) {
    const serviceName = await new Promise<string | null>((resolve) => {
      const question = 'Enter the service name you want to add a credential for (or type "exit" to return to the menu):\n ';
      readlineInterface.question(question, (input: string) => {
        if (input.toLowerCase() === "exit") {
          console.log('Exiting to main menu...');
          resolve(null);
        } else {
          resolve(input);
        }
      });
    });

    // Break the loop if serviceName is null (user typed "exit")
    if (serviceName === null) {
      break;
    }

    // Attempt to find the service by name
    const findServiceByNameResult = await findServiceByName({ serviceName: serviceName, dbConnection: credentialManager.dbConnection });
    if (!findServiceByNameResult.status) {
      console.log(findServiceByNameResult.message + ' Please try again.');
      // Don't break; allow the loop to continue
    } else {
      // If service is found, return the result and break the loop
      if (createdInternally) {
        readlineInterface.close();
      }
      return findServiceByNameResult; // Successfully found service, can exit the loop
    }
  }

  // If we reach this point, it means the user has chosen to exit
  if (createdInternally && readlineInterface) {
    readlineInterface.close();
  }
  return null; // Signify that the user exited
}
