import { promptMenu } from "./utils/promptMenu";
import { performAction } from "./utils/performAction";
import { CredentialManager } from "./CredentialManager";
import { createReadlineInterface } from './utils/createReadlineInterface';

async function startMenu() {
  // Initialize CredentialManager and its projects
  const credentialManager = new CredentialManager();

  // Define default project and cabinet names
  const defaultProjectName = process.env.DEFAULT_OFFICE_NAME as string ;

  const value = `${Math.floor(Math.random() * 100)}`;
  await delay(1000);
  const projectManager = credentialManager.projects.get(defaultProjectName);
  await delay(1000); // Added delay

  if (!projectManager) {
    console.error(`Project '${defaultProjectName}' not found.`);
    return;
  }
  const credentialName = "bestkey";
  const envVariableName = "OPEN_AI_API_KEY"; // or any appropriate environment name
  const envType = "production"; // or any appropriate environment name

  const credentialData = {
    name: credentialName,
    envType,
    envVariableName,
    createdAt: new Date(), // Set the creation date to now
    value: value, // Assuming 'value' is part of the additional data you want to store
  };
  
  // Call the addCredentialToCabinet method to insert the new service with the random value
  await projectManager.addCredentialToCabinet('OpenAI', credentialData);
  console.log(`Credential 'OpenAI' with random value ${value} added to cabinet 'OpenAI' in project '${defaultProjectName}'.`);

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
