import { promptMenu } from "./utils/promptMenu";
import { performAction } from "./utils/performAction";
import { initializeAllProjects, addProject, projects } from "./CredentialManager"; // Assume we've exported these functions
import { createReadlineInterface } from './utils/createReadlineInterface';

async function startMenu() {
  await initializeAllProjects({dbUsername, dbPassword, dbCluster});

  const defaultProjectName = process.env.DEFAULT_OFFICE_NAME || "DefaultProject";

  await delay(1000);
  const projectManager = projects.get(defaultProjectName);
  if (!projectManager) {
    console.error(`Project '${defaultProjectName}' not found.`);
    return;
  }
  await delay(1000);

  const credentialData = {
    name: "bestkey",
    envType: "production",
    envVariableName: "OPEN_AI_API_KEY",
    createdAt: new Date(),
    value: "sampleKey123",
  };
  
  // Assuming addCredentialToCabinet is now a function of ProjectManager or has been made a standalone function
  await projectManager.addCredentialToCabinet('OpenAI', credentialData) as any;
  console.log(`Credential 'OpenAI' with random value ${credentialData.value} added to cabinet 'OpenAI' in project '${defaultProjectName}'.`);

  while (true) {
    const readlineInterfaceResult = createReadlineInterface();

    if (!readlineInterfaceResult.status) {
      console.error(`Failed to create readline interface: ${readlineInterfaceResult.message}`);
      process.exit(1);
    }

    const readLineInterface = readlineInterfaceResult.interfaceInstance as any;

    const menuResult = await promptMenu({ readLineInterface });
    if (!menuResult.status) {
      console.error(`Error in menu selection: ${menuResult.message}`);
      continue;
    }

    const action = menuResult.choice;
    // Adjust performAction or its usage to accommodate the new function-based design
  //  const { continueApp } = await performAction({ projectManager, action, readLineInterface }); // Adjusted to pass projectManager instead of credentialManager
    if (!continueApp) break;
  }

  console.log('Exiting application...');
}

function delay(milliseconds:any) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

startMenu(); 
