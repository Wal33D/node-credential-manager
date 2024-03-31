import { promptMenu } from "./utils/promptMenu";
import { performAction } from "./utils/performAction";
import { CredentialManager } from "./CredentialManager";
import { createReadlineInterface } from './utils/createReadlineInterface';

async function startMenu({ credentialManager = new CredentialManager() }) {
  await credentialManager.ensureDBInit();

  while (true) {
    const readlineInterfaceResult = createReadlineInterface();

    if (!readlineInterfaceResult.status) {
      console.error(`Failed to create readline interface: ${readlineInterfaceResult.message}`);
      process.exit(1);
    }

    const readLineInterface = readlineInterfaceResult.interfaceInstance;
    const result = await credentialManager.getAllCredentials();

    if (!result.status) {
      console.log("No credentials found.");
      return;
    }

    // Display the credentials
    console.log(`\nCREDENTIALS & KEYS`);
    console.log(`- Database: ${result.databaseName} | Collection: ${result.collectionName}`);
    console.log(`- Services: ${result.servicesCount} | Credentials: ${result.totalCredentials}\n`);

    // Await the user's action choice
    const menuResult = await promptMenu({ readLineInterface });
    if (!menuResult.status) {
      console.error(`Error in menu selection: ${menuResult.message}`);
      continue;
    }

    const action = menuResult.choice;

    const continueApp = await performAction({ credentialManager, action, readLineInterface });
    if (!continueApp) break;
  }

  console.log('Exiting application...');
  process.exit(0);
}

startMenu({});
