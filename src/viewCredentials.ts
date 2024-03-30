import { CredentialManager } from "./CredentialManager";

async function viewCredentials() {
  const credentialManager = new CredentialManager();

  await credentialManager.ensureDBInit();

  const result = await credentialManager.getAllCredentials();

  if (result.status) {
    console.log(`\n${result.message}`);
    console.log(`Total Services: ${result.count}\n`);

    result.credentials.forEach((cred) => {
      console.log(`-${cred.name}`);

      // Determine if there's a Primary or Secondary key missing
      const hasPrimary = cred.keys.some((key: { keyName: string; }) => key.keyName === 'Primary');
      const hasSecondary = cred.keys.some((key: { keyName: string; }) => key.keyName === 'Secondary');

      // Display existing keys
      cred.keys.forEach((key: { keyName: any; apiKey: any; }) => {
        console.log(`  ${key.keyName}: ${key.apiKey}`);
      });

      // Prompt to add missing keys
      if (!hasPrimary) {
        console.log("  Primary: Add Key Now");
      }
      if (!hasSecondary) {
        console.log("  Secondary: Add Key Now");
      }

      console.log("\n"); // Add a newline for spacing
    });
  } else {
    console.log("No credentials found.");
  }
}

viewCredentials();
