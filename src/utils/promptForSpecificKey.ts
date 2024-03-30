import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { findServiceByName } from './findServiceByName';
import { findSpecificKeyForService } from './findSpecificKeyForService';
import { promptForKeyType } from './promptForKeyType';

// Assuming createReadlineInterface is defined elsewhere in your code
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export async function promptForSpecificKey(credentialManager: CredentialManager, rl: readline.Interface = createReadlineInterface()) {
  return new Promise((resolve) => {
    const serviceNameQuestion = 'Enter the service name you want to retrieve the key for (or type "exit" to return to the menu): ';

    rl.question(serviceNameQuestion, async (input) => {
      if (input.toLowerCase() === "exit") {
        console.log('Exiting to main menu...');
        rl.close();
        resolve(null);
        return;
      }

      const serviceValidation = await findServiceByName({
        serviceName: input,
        dbConnection: credentialManager.dbConnection
      });

      if (!serviceValidation.status) {
        console.log(serviceValidation.message + ' Please try again.');
        // No need to close rl here if it will be reused
        resolve(await promptForSpecificKey(credentialManager, rl)); // Recursive call to ask again
        return;
      } else {
        // Here we shouldn't close rl if it's going to be reused
        const keyType = await promptForKeyType(credentialManager, rl);
        if (keyType === null) {
          console.log(serviceValidation.message + ' Please try again.');
          
          resolve(await promptForSpecificKey(credentialManager, rl)); // Recursive call to ask again
          return;
        }

        const { credential } = await findSpecificKeyForService({
          serviceName: input,
          keyType: keyType as string,
          dbConnection: credentialManager.dbConnection
        });

        if (!credentialResult.status) {
          console.log(credentialResult.message + ' Please try again.');
          // Optionally ask the user if they want to try again or exit.
          // For simplicity, this example assumes they'll retry automatically.
          // Implement your logic here if you want to offer a choice.
      } else {
          console.log(credentialResult.message); // Key found, display success message
          retry = false; // Exit loop if the key is found
      }
  }

  if (credentialResult && credentialResult.status) {
      return credentialResult.credential; // Return the found credential
  } else {
      return null; // Return null if no credential was found or if the user exited
  }
}