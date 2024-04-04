import { CredentialManager } from "./CredentialManager";

async function startMenu() {
  const credentialManager = new CredentialManager();

  const defaultProjectName = process.env.DEFAULT_OFFICE_NAME as string ;

  await delay(1000);
  const projectManager = credentialManager.projects.get(defaultProjectName);
  await delay(1000); 

  if (!projectManager) {
    console.error(`Project '${defaultProjectName}' not found.`);
    return;
  }

  const credentialData = {
    name: "bestkey",
    envType:"production",
    envVariableName:"OPEN_AI_API_KEY",
    createdAt: new Date(), 
    value: "sampleKey123",
  };
  
  await projectManager.addCredentialToCabinet('OpenAI', credentialData);
  console.log(`Credential 'OpenAI' with random value ${credentialData.value} added to cabinet 'OpenAI' in project '${defaultProjectName}'.`);

  console.log('Exiting application...');
  process.exit(0);
}


startMenu(); 
function delay(milliseconds:any) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
