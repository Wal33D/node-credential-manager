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
export async function promptForSpecificKey(credentialManager: CredentialManager, rl: readline.Interface) {
  let serviceName = '';
  let keyType = '';
  let retryServiceName = true;

  while (retryServiceName) {
      const serviceNameQuestion = 'Enter the service name you want to retrieve the key for (or type "exit" to return to the menu): ';
      serviceName = await new Promise((resolve) => {
          rl.question(serviceNameQuestion, (input) => {
              if (input.toLowerCase() === "exit") {
                  console.log('Exiting to main menu...');
                  resolve(null as any);
              } else {
                  resolve(input);
              }
          });
      });

      if (!serviceName) return null; // Exit the function if user decides to exit

      // Use findServiceByName to validate the service name
      const serviceValidation = await findServiceByName({
          serviceName: serviceName,
          dbConnection: credentialManager.dbConnection
      });

      if (!serviceValidation.status) {
          console.log(serviceValidation.message);
          // Offer user a chance to re-enter the service name directly here
          // If your application logic requires, prompt the user if they want to retry
          // For simplicity, assume retry
          continue;
      } else {
          console.log(`Service '${serviceName}' found.`);
          retryServiceName = false; // Exit the loop on successful service name validation
      }
  }

  // Proceed to request key type from the user
  // Assuming promptForKeyType function does not require modifications for this part
  keyType = await promptForKeyType(credentialManager, rl) as any;
  if (!keyType) return null; // Handle case where user exits during key type selection

  // Continue with finding the specific key
  const { status, credential, message } = await findSpecificKeyForService({
      serviceName: serviceName,
      keyType: keyType,
      dbConnection: credentialManager.dbConnection
  });

  console.log(message); // Display the message from findSpecificKeyForService
  if (status) {
      // Key found successfully
      return credential;
  } else {
      // Handle the case where the key wasn't found as needed
      return null;
  }
}
