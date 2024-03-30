import readline from 'readline';
import { CredentialManager } from "./CredentialManager";
import { promptForServiceName } from './utils/promptForServiceName';
import { promptForSpecificKey } from './utils/promptForSpecificKey';

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

async function performAction(credentialManager: CredentialManager, action: string) {
  const rl = createReadlineInterface(); // Create a single readline interface
  try {
    switch (action) {
      case '1':
        console.log('Option to add a new credential selected.');
        const serviceInfo = await promptForSpecificKey(credentialManager, rl); // Pass the readline interface
        if (serviceInfo === null) {
          return true;
        }
        console.log(serviceInfo);
        break;
      case '2':
        console.log('Option to update an existing credential selected.');
        // If you have a function for updating, you would also pass rl there
        break;
      case '3':
        console.log('Option to delete a credential selected.');
        // Similarly, pass rl to any prompts involved in deletion
        break;
      case '4':
        console.log('Exiting...');
        return false;
      default:
        console.log('Invalid option selected. Please try again.');
        return true;
    }
    return true;
  } finally {
    rl.close(); // Ensure the readline interface is always closed when done
  }
}

viewCredentials({});
