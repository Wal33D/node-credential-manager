import { CredentialManager } from "./CredentialManager";

async function viewCredentials() {
  const credentialManager = new CredentialManager();

  await credentialManager.ensureDBInit();

  const result = await credentialManager.getAllCredentials();

  if (result.status) {

    console.log(`${result.message}`);
    console.log(`Total services: ${result.servicesCount}`);
    console.log(`Total services: ${result.totalCredentials}`);

    result.credentials.forEach((cred) => {
      console.log(`   -${cred.name}`);

      const hasPrimary = cred.keys.some((key: { keyName: string; }) => key.keyName === 'Primary');
      const hasSecondary = cred.keys.some((key: { keyName: string; }) => key.keyName === 'Secondary');

      cred.keys.forEach((key: { keyName: any; apiKey: any; }) => {
        console.log(`  ${key.keyName}: ${key.apiKey}`);
      });

      if (!hasPrimary) {
        console.log("  Primary: Add Key Now");
      }
      if (!hasSecondary) {
        console.log("  Secondary: Add Key Now");
      }

      console.log("\n"); 
    });

  
  } else {
    console.log("No credentials found.");
  }
}

viewCredentials();
