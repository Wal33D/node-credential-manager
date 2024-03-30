import { CredentialManager } from "./CredentialManager";
import readline from 'readline';

async function viewCredentials() {
  const credentialManager = new CredentialManager();

  await credentialManager.ensureDBInit();

  const result = await credentialManager.getAllCredentials();

  console.log(`\nCREDENTIALS & KEYS: ${result.message}`);
  if (result.status) {
    console.log(`-Database: ${result.databaseName}`);
    console.log(`-Total services managed: ${result.servicesCount}`);
    console.log(`-Total credentials stored: ${result.totalCredentials}\n`);
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
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    console.log('\n');
    rl.question('What would you like to do next?\n1. Add a new credential\n2. Update an existing credential\n3. Delete a credential\n4. Exit\nPlease enter your choice (1-4): ', function (answer) {
      switch (answer) {
        case '1':
          console.log('Option to add a new credential selected.');
          // Implement functionality here
          break;
        case '2':
          console.log('Option to update an existing credential selected.');
          // Implement functionality here
          break;
        case '3':
          console.log('Option to delete a credential selected.');
          // Implement functionality here
          break;
        case '4':
          console.log('Exiting...');
          break;
        default:
          console.log('Invalid option selected.');
      }
      rl.close();
    });

    rl.on('close', function () {
      process.exit(0);
    });
  } else {
    console.log("No credentials found.");
  }
}

viewCredentials();
