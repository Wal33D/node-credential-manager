import { CredentialManager } from "./CredentialManager";

async function viewCredentials() {
  const credentialManager = new CredentialManager();

  await credentialManager.ensureDBInit();

  const result = await credentialManager.getAllCredentials();

  if (result.status) {
    if (result.count > 0) {
      console.log(`${result.message} Total credentials: ${result.count}`);
      result.credentials.forEach((cred) => {
        console.log(`Name: ${cred.name}`);
        console.log('Keys:', cred.keys); 
        console.log(`\n`);
      });
    } else {
      console.log("No credentials found.");
    }
  } else {
    console.log(`Failed to retrieve credentials: ${result.message}`);
  }
}

viewCredentials();
