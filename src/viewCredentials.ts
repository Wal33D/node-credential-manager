import readline from 'readline';
import { CredentialManager } from "./CredentialManager";

async function viewCredentials() {
  const credentialManager = new CredentialManager();
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
  const continueApp = await performAction(credentialManager, action);
  if (continueApp) {
    await viewCredentials();
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
        rl.close(); // Make sure to close the readline interface here
        resolve(answer);
      }
    );
  });
}

async function performAction(credentialManager: CredentialManager, action: unknown) {
  switch (action) {
    case '1':
      console.log('Option to add a new credential selected.');
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
  }
  return true; // Continue the application
}


viewCredentials();
