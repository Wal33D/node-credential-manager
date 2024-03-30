import { CredentialManager } from "./CredentialManager";

async function viewCredentials() {
  const credentialManager = new CredentialManager();

  // Ensure database initialization is complete before listing credentials
  await credentialManager.ensureDBInit();

  // Now it's safe to proceed with database operations
  const creds = await credentialManager.listAllCredentials();
  console.log(creds);
}

viewCredentials();
