import { promptMenu } from "./utils/promptMenu";
import { promptForKeyType } from './utils/promptForKeyType';
import { CredentialManager } from "./CredentialManager";
import { promptForServiceName } from './utils/promptForServiceName';
import { createReadlineInterface } from './utils/createReadlineInterface';
import { findSpecificKeyForService } from './utils/findSpecificKeyForService';

async function viewCredentials({ credentialManager = new CredentialManager() }) {
  await credentialManager.ensureDBInit();

  while (true) {
    const readlineInterfaceResult = createReadlineInterface();

    if (!readlineInterfaceResult.status) {
      console.error(`Failed to create readline interface: ${readlineInterfaceResult.message}`);
      process.exit(1); // Exit the application if unable to create the readline interface
    }

    const rl = readlineInterfaceResult.interfaceInstance;
    const result = await credentialManager.getAllCredentials();

    if (!result.status) {
      console.log("No credentials found.");
      return; // Exit if no credentials are found or if you want to stop the loop for any reason
    }

    // Display the credentials
    console.log(`\nCREDENTIALS & KEYS`);
    console.log(`- Database: ${result.databaseName} | Collection: ${result.collectionName}`);
    console.log(`- Services: ${result.servicesCount} | Credentials: ${result.totalCredentials}`);
    console.log(`- Credentials: ${result.message}\n`);

    result.credentials.forEach((cred) => {
      console.log(` -${cred.name}`);
      cred.keys.forEach((key: { keyName: any; apiKey: any; }) => {
        console.log(`   ${key.keyName}: ${key.apiKey}`);
      });

      if (!cred.keys.some((key: { keyName: string; }) => key.keyName === 'Primary')) {
        console.log("   Primary: <Add Key Now>");
      }
      if (!cred.keys.some((key: { keyName: string; }) => key.keyName === 'Secondary')) {
        console.log("   Secondary: <Add Key Now>");
      }
    });

    console.log('\n');

    // Await the user's action choice
    const menuResult = await promptMenu({ rl }); // Updated to match the refactored promptMenu function
    if (!menuResult.status) {
      console.error(`Error in menu selection: ${menuResult.message}`);
      continue; // Or handle the error as needed
    }

    const action = menuResult.choice;
    // Perform the chosen action and break the loop if the action returns false (e.g., to exit)
    const continueApp = await performAction({ credentialManager, action, rl });
    if (!continueApp) break; // Exit loop if continueApp is false
  }

  console.log('Exiting application...');
  process.exit(0); // Ensure the application exits after breaking out of the loop
}



const performAction = async ({
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

        const serviceNameResult = await promptForServiceName({credentialManager, rl}) as any;
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
        console.log('\n5. Search by service name and key selected.');

        const { status: serviceStatus, value, serviceNameKey, message: serviceMessage } = await promptForServiceName({credentialManager, rl}) as any;
        message = serviceMessage;
        status = serviceStatus;

        console.log(`- Service: ${serviceNameKey} | Status: ${status}`);
        console.log(`- Message: ${message}`);
        console.log(value);

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

viewCredentials({});
