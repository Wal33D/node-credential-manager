import readline from 'readline';
import { CredentialManager } from "./CredentialManager";
import { promptForServiceName } from './utils/promptForServiceName';
import { promptForSpecificKey } from './utils/promptForSpecificKey';
import { promptForKeyType } from './utils/promptForKeyType';
import { findSpecificKeyForService } from './utils/findSpecificKeyForService';

async function viewCredentials({ credentialManager = new CredentialManager() }) {
  await credentialManager.ensureDBInit();

  
  while (true) { // Start an infinite loop to repeatedly show the menu until the user exits
    const rl = createReadlineInterface();

    const result = await credentialManager.getAllCredentials();

    if (!result.status) {
      console.log("No credentials found.");
      return; // Exit if no credentials are found or if you want to stop the loop for any reason
    }

    // Display the credentials
    console.log(`\nCREDENTIALS & KEYS: ${result.message}`);
    console.log(`-Database: ${result.databaseName}`);
    console.log(`-Total services managed: ${result.servicesCount}`);
    console.log(`-Total credentials stored: ${result.totalCredentials}\n`);
    console.log(`[CREDENTIALS]`);

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
    const action = await promptMenu(rl); // Pass the readline interface to promptMenu
    // Perform the chosen action and break the loop if the action returns false (e.g., to exit)
    const continueApp = await performAction(credentialManager, action, rl);
    if (!continueApp) break; // Exit loop if continueApp is false
  }

  console.log('Exiting application...');
  process.exit(0); // Ensure the application exits after breaking out of the loop
}


function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function promptMenu(rl:any) {
  return new Promise((resolve) => {
    rl.question(
      'What would you like to do next?\n' +
      '1. Add a new credential\n' +
      '2. Update an existing credential\n' +
      '3. Delete a credential\n' +
      '4. Search for a specific key\n' +
      '5. Search by service name and key\n' +
      '6. Exit\nPlease enter your choice (1-6): ',
      (answer:any) => {
        resolve(answer); // No need to close rl here; it will be reused
      }
    );
  });
}

async function performAction(credentialManager: CredentialManager, action: any, rl:any) {
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
          return true; // Exit if no valid service name is provided
        }

        const keyTypeResult = await promptForKeyType(credentialManager, rl) as any;
        if (!keyTypeResult || keyTypeResult.status === false) {
          console.log(keyTypeResult ? keyTypeResult.message : 'Exiting to main menu...');
          return true; // Exit if no valid key type is provided
        }
console.log( serviceNameResult, keyTypeResult)
        // Now that valid service name and key type are obtained, use them to find the specific key
        const { status, credential, message } = await findSpecificKeyForService({
          serviceName: serviceNameResult.serviceName, // Assuming the result contains the validated service name
          keyType: keyTypeResult.result , // Assuming the result contains the validated key type
          dbConnection: credentialManager.dbConnection
        });

        // Log the result of findSpecificKeyForService
        console.log(status, credential, message );
        if (status) {
          // If the key is successfully found, you can further process/display the credential as needed
          console.log('Key details:', credential);
        }
        break;
      case '5':
        console.log('Option to search by service name and key selected.');
        const serviceInfo = await promptForServiceName(credentialManager, rl);
        if (serviceInfo === null) {
          return true;
        }
        console.log(serviceInfo);
        break;
      case '6':
        console.log('Exiting...');
        return false;
      default:
        console.log('Invalid option selected. Please try again.');
        return true;
    }
    return true;
  } finally {
    rl.close();
  }
}


viewCredentials({});
