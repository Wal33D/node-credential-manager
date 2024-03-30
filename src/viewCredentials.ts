import { CredentialManager } from "./CredentialManager";

async function viewCredentials() {
  const credentialManager = new CredentialManager();

  await credentialManager.ensureDBInit();

  const result = await credentialManager.getAllCredentials();

  console.log(`\nCREDENTIALS & KEYS: ${result.message}`);
  if (result.status) {
    console.log(`-Total services managed: ${result.servicesCount}`);
    console.log(`-Total credentials stored: ${result.totalCredentials}\n`);
console.log(" Credentials:");
    result.credentials.forEach((cred) => {
      console.log(` -${cred.name}`);

      const hasPrimary = cred.keys.some((key: { keyName: string; }) => key.keyName === 'Primary');
      const hasSecondary = cred.keys.some((key: { keyName: string; }) => key.keyName === 'Secondary');

      cred.keys.forEach((key: { keyName: any; apiKey: any; }) => {
        console.log(`   ${key.keyName}: ${key.apiKey}`);
      });

      if (!hasPrimary) {
        console.log("   Primary: <Add Key Now>");
      }
      if (!hasSecondary) {
        console.log("   Secondary: <Add Key Now>");
      }
    });
  } else {
    console.log("   No credentials found.");
  }
}

viewCredentials();
