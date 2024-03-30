import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { findServiceByName } from './findServiceByName';

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export async function promptForServiceName(credentialManager: CredentialManager, rl: readline.Interface = createReadlineInterface()) {
  return new Promise((resolve) => {
    const question = 'Enter the service name you want to add a credential for (or type "exit" to return to the menu): ';

    rl.question(question, async (serviceName) => {
      if (serviceName.toLowerCase() === "exit") {
        console.log('Exiting to main menu...');
        // Only close the readline interface if it was created within this function
        if (arguments.length <= 1) {
          rl.close();
        }
        resolve(null);
        return;
      }

      const val = await findServiceByName({ serviceName, dbConnection: credentialManager.dbConnection });
      if (!val.status) {
        console.log(val.message + ' Please try again.');
        // Do not close here, as we're making a recursive call
        resolve(await promptForServiceName(credentialManager, rl)); // Recursive call to ask again
      } else {
        // Only close the readline interface if it was created within this function
        if (arguments.length <= 1) {
          rl.close();
        }
        resolve(val); // Resolve with the found service
      }
    });
  });
}
