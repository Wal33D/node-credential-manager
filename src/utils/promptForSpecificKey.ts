import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { findSpecificKeyForService } from './findSpecificKeyForService';
import { promptForKeyType } from './promptForKeyType';

export async function promptForSpecificKey(credentialManager: CredentialManager, rl: readline.Interface) {
  let serviceName = '';
  let keyType = '';
  let message = '';
  let status = false;
  let credential = null;

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

  // Exit the function if user decides to exit
  if (!serviceName) return null;

  // Loop until a valid key is found, user decides to exit, or chooses not to try the alternative key
  while (true) {
      keyType = await promptForKeyType(credentialManager, rl) as any;
      if (!keyType) return null; // User chose to exit

      ({ status, credential, message } = await findSpecificKeyForService({
          serviceName: serviceName,
          keyType: keyType,
          dbConnection: credentialManager.dbConnection
      }));

      console.log(message); // Display the message from findSpecificKeyForService

      if (status) {
          // Key found successfully
          return credential;
      } else {
          // Check if the message indicates an alternative key is available
          if (message.includes("However, a")) {
              // Ask user if they want to try for the alternative key
              const tryAlternativeKey = await new Promise((resolve) => {
                  rl.question("Do you want to try for the alternative key? (yes/no): ", (input) => {
                      resolve(input.toLowerCase() === "yes");
                  });
              });

              if (!tryAlternativeKey) {
                  console.log("No key retrieved. Exiting to main menu.");
                  return null; // User chose not to try for the alternative key
              }

              // If user chooses to try for the alternative key, loop will continue with new keyType set
              keyType = keyType === "Primary" ? "Secondary" : "Primary";
          } else {
              // No alternative key available or user doesn't want to try for it
              return null;
          }
      }
  }
}
