import { CredentialManager } from "./CredentialManager";

async function viewCredentials() {
  const credentialManager = new CredentialManager();

  await credentialManager.ensureDBInit();

  const result = await credentialManager.getAllCredentials();

  if (result.status) {
    if (result.count > 0) {
      console.log(`${result.message} Total credentials: ${result.count}`);
      result.credentials.forEach((cred, index) => {
        console.log(`Name: ${cred.name}`);
        console.log('Keys:', cred.keys); 
        console.log(`-----`);
      });
    } else {
      console.log("No credentials found.");
    }
  } else {
    console.log(`Failed to retrieve credentials: ${result.message}`);
  }
}

viewCredentials();
