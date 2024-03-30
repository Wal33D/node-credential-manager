import { CredentialManager } from "./CredentialManager";

async function viewCredentials() {
  const credentialManager = new CredentialManager();

  // Ensure database initialization is complete before listing credentials
  await credentialManager.ensureDBInit();

  // Now it's safe to proceed with database operations
  const result = await credentialManager.getAllCredentials();

  if (result.status) {
    console.log(`\n${result.message}`);
    if (result.count > 0) {
      console.log(`Total credentials: ${result.count}\n`);

      result.credentials.forEach((cred) => {
        // Prepare a new object for each credential to hold the keys as key-value pairs
        //@ts-ignore
        const keysObject = cred.keys.reduce((obj:any, { keyName, apiKey }) => {
          obj[keyName] = apiKey;
          return obj;
        }, {});

        // Log the credential name and its keys as an object
        console.log(`-${cred.name}`);
        console.log(keysObject);
      });
    } else {
      console.log("No credentials found.");
    }
  } else {
    console.log(`Failed to retrieve credentials: ${result.message}`);
  }
}

viewCredentials();
