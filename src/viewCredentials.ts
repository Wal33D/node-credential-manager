import readline from 'readline';
import { CredentialManager } from "./CredentialManager";
import { findServiceByName } from './utils/findServiceByName';


async function viewCredentials({ credentialManager = new CredentialManager() }: { credentialManager?: CredentialManager }) {
  await credentialManager.ensureDBInit();
  const result = await credentialManager.getAllCredentials();

  if (!result.status) {
    console.log("No credentials found.");
    return;
  }

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
  const action = await promptMenu();
  const continueApp = await performAction(credentialManager, action as any);
  if (continueApp) {
    await viewCredentials({ credentialManager });
  } else {
    process.exit(0);
  }
}

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function promptMenu() {
  const rl = createReadlineInterface();
  return new Promise((resolve) => {
    rl.question(
      'What would you like to do next?\n1. Add a new credential\n2. Update an existing credential\n3. Delete a credential\n4. Exit\nPlease enter your choice (1-4): ',
      (answer) => {
        rl.close();
        resolve(answer);
      }
    );
  });
}
async function promptForServiceName(credentialManager: CredentialManager) {
  const rl = createReadlineInterface();
  const question = 'Enter the service name you want to add a credential for (or type "exit" to return to the menu): ';

  return new Promise((resolve) => {
    rl.question(question, async (serviceName) => {
      if (serviceName.toLowerCase() === "exit") {
        console.log('Exiting to main menu...');
        rl.close();
        resolve(null); // Resolve with null to indicate exit
        return; // Exit the function early
      }

      const val = await findServiceByName({ serviceName, dbConnection: credentialManager.dbConnection });
      if (!val.status) {
        console.log(val.message + ' Please try again.');
        rl.close(); // Close the current interface
        resolve(await promptForServiceName(credentialManager)); // Recursive call to ask again
      } else {
        rl.close();
        resolve(val); // Resolve with the found service
      }
    });
  });
}

async function performAction(credentialManager: CredentialManager, action: string) {
  switch (action) {
    case '1':
      console.log('Option to add a new credential selected.');
      const serviceInfo = await promptForServiceName(credentialManager);
      if (serviceInfo === null) {
        return true; // User chose to exit, return to continue the application (back to the menu)
      }
      console.log(serviceInfo);
      break;
    case '2':
      console.log('Option to update an existing credential selected.');
      break;
    case '3':
      console.log('Option to delete a credential selected.');
      break;
    case '4':
      console.log('Exiting...');
      return false; // Signal to exit the application
    default:
      console.log('Invalid option selected. Please try again.');
      return true; // Continue the application to allow re-selection
  }
  return true; // Continue the application
}

viewCredentials({});
