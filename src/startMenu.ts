import { promptMenu } from "./utils/promptMenu";
import { performAction } from "./utils/performAction";
import { CredentialManager } from "./CredentialManager";
import { createReadlineInterface } from './utils/createReadlineInterface';

async function startMenu() {
  // Initialize the CredentialManager
  const credentialManager = new CredentialManager();

  // Initialize the CredentialManager (ensure connection, etc.)
  await credentialManager.initialize();

  while (true) {
    const readlineInterfaceResult = createReadlineInterface();

    if (!readlineInterfaceResult.status) {
      console.error(`Failed to create readline interface: ${readlineInterfaceResult.message}`);
      process.exit(1);
    }

    const readLineInterface = readlineInterfaceResult.interfaceInstance as any;

    // Await the user's action choice
    const menuResult = await promptMenu({ readLineInterface });
    if (!menuResult.status) {
      console.error(`Error in menu selection: ${menuResult.message}`);
      continue;
    }

    const action = menuResult.choice;

    const { continueApp } = await performAction({ credentialManager, action, readLineInterface });
    if (!continueApp) break;
  }

  console.log('Exiting application...');
  process.exit(0);
}

startMenu(); // Removed empty object passed as an argument
