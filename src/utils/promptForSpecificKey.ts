import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { findServiceByName } from './findServiceByName';
import { findSpecificKeyForService } from './findSpecificKeyForService';
import { promptForKeyType } from './promptForKeyType';


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

      if (!serviceName) return null; 

      const serviceValidation = await findServiceByName({
          serviceName: serviceName,
          dbConnection: credentialManager.dbConnection
      });

      if (!serviceValidation.status) {
          console.log(serviceValidation.message);

          continue;
      } else {
          console.log(`Service '${serviceName}' found.`);
          retryServiceName = false; 
      }
  }

  keyType = await promptForKeyType(credentialManager, rl) as any;
  if (!keyType) return null; 

  const { status, credential, message } = await findSpecificKeyForService({
      serviceName: serviceName,
      keyType: keyType,
      dbConnection: credentialManager.dbConnection
  });

  console.log(message);
  if (status) {
      return credential;
  } else {
      return null;
  }
}
