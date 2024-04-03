import { promptMenu } from "./utils/promptMenu";
import { performAction } from "./utils/performAction";
import { CredentialManager } from "./CredentialManager";
import { createReadlineInterface } from './utils/createReadlineInterface';

async function startMenu() {
  // Initialize CredentialManager and its offices
  const credentialManager = new CredentialManager();

  // Define default office and cabinet names
  const defaultOfficeName = process.env.DEFAULT_OFFICE_NAME as string ;
  const defaultCabinetName = process.env.DEFAULT_CABINET_NAME as string;

  // Generate a random value for demonstration purposes
  const randomValue = Math.floor(Math.random() * 100);
  await delay(1000); // Wait for 3000 milliseconds (3 seconds)
  // Retrieve the OfficeManager instance for the default office
  const officeManager = credentialManager.offices.get(defaultOfficeName);
  await delay(1000); // Wait for 3000 milliseconds (3 seconds)

  if (!officeManager) {
    console.error(`Office '${defaultOfficeName}' not found.`);
    return;
  }

  // Call the addServiceToCabinet method to insert the new service with the random value
  await officeManager.addServiceToCabinet(defaultCabinetName, "OpenAI", { randomValue });
  console.log(`Service 'OpenAI' with random value ${randomValue} added to cabinet '${defaultCabinetName}' in office '${defaultOfficeName}'.`);

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
    //@ts-ignore
    const { continueApp } = await performAction({ credentialManager, action, readLineInterface });
    if (!continueApp) break;
  }

  console.log('Exiting application...');
  process.exit(0);
}


startMenu(); // Removed empty object passed as an argument
function delay(milliseconds:any) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
