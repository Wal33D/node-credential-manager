import { CredentialManager } from "./CredentialManager";

async function viewCredentials() {
  const credentialManager = new CredentialManager();

  // Ensure database initialization is complete before listing credentials
  await credentialManager.ensureDBInit();

  // Now it's safe to proceed with database operations
  const result = await credentialManager.getAllCredentials();

  if (result.status) {
    if (result.count > 0) {
      console.log(`${result.message} Total credentials: ${result.count}`);
      result.credentials.forEach((cred, index) => {
        console.log(`Credential #${index + 1}:`);
        console.log(`Name: ${cred.name}`);
        console.log('Keys:', cred.keys); // Assuming 'keys' is an array you want to print out directly
      });
    } else {
      console.log("No credentials found.");
    }
  } else {
    console.log(`Failed to retrieve credentials: ${result.message}`);
  }
}

viewCredentials();
