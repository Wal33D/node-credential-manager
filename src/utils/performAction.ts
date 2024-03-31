import { promptForKeyType } from '../utils/promptForKeyType';
import { CredentialManager } from "../CredentialManager";
import { promptForServiceName } from '../utils/promptForServiceName';
import { findSpecificKeyForService } from '../utils/findSpecificKeyForService';

export const performAction = async ({
    credentialManager,
    action, 
  rl
}: { 
  credentialManager: CredentialManager, 
  action: string, 
  rl: any 
}): Promise<{ status: boolean, message: string, continue: boolean }> => {
  let status = false;
  let message = '';
  let continueApp = true;

    try {
      switch (action) {
        case '1':
          console.log('Option to add a new credential selected.');
          break;
        case '2':
          console.log('Option to update an existing credential selected.');
          // Implementation...
          break;
        case '3':
          console.log('Option to delete a credential selected.');
          // Implementation...
          break;
        case '4':
          console.log('Option to search for a specific key selected.');

          const serviceNameResult = await promptForServiceName(credentialManager, rl) as any;
          if (!serviceNameResult || serviceNameResult.status === false) {
            console.log(serviceNameResult ? serviceNameResult.message : 'Exiting to main menu...');
            status = true;
            message = '';
          }

          let keyTypeResult: any;
          let findKeyResult = { status: false, credential: null, message: '' };

          while (!findKeyResult.status) {
            keyTypeResult = await promptForKeyType(credentialManager, rl);
            if (!keyTypeResult || keyTypeResult.status === false || keyTypeResult.result.toLowerCase() === "back") {
              console.log(keyTypeResult ? keyTypeResult.message : 'Exiting to main menu...');
              status = true;
              message = '';
            }

            // Attempt to find the specific key with the given service name and key type
            findKeyResult = await findSpecificKeyForService({
              serviceName: serviceNameResult.serviceName, // Use the validated service name
              keyType: keyTypeResult.result, // Use the user-provided key type
              dbConnection: credentialManager.dbConnection
            });

            // If the key is not found, inform the user and the loop will prompt for the key type again
            if (!findKeyResult.status) {
              console.log(findKeyResult.message);
            }
          }

          // If the loop exits because a key is found (status: true), log the key details
          console.log('Key details:', findKeyResult.credential);
          break

        case '5':
          console.log('Option to search by service name and key selected.');
          const serviceInfo = await promptForServiceName(credentialManager, rl);
          if (serviceInfo === null) {
            status = true;
            message = 'Search by service name and key option selected';
          }
          console.log(serviceInfo);

          break;
        case '6':
          console.log('Exiting...');
          status = true;
          message = 'Exit option selected';
          continueApp = false;

          break;
        default:
          console.log('Invalid option selected. Please try again.');
          status = true;
          message = 'Invalid option selected';
      }
    } catch (error: any) {
      message = `An error occurred: ${error.message}`;
      continueApp = true; // Decide whether you want to continue or exit based on the error
    } finally {
      rl.close();
    }

    return { status, message, continue: continueApp };
  };
