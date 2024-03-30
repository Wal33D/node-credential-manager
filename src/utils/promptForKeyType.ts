import readline from 'readline';
import { CredentialManager } from "./CredentialManager";

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export async function promptForKeyType(credentialManager: CredentialManager) {
  return new Promise((resolve) => {
    const rlKeyType = createReadlineInterface();
    const keyTypeQuestion = 'Enter the key type ("Primary" or "Secondary") you want to retrieve (or type "exit" to return to the menu): ';

    rlKeyType.question(keyTypeQuestion, (input) => {
      if (input.toLowerCase() === "exit") {
        console.log('Exiting to main menu...');
        rlKeyType.close();
        resolve(null);
      } else if (["primary", "secondary"].includes(input.toLowerCase())) {
        rlKeyType.close();
        resolve(input.charAt(0).toUpperCase() + input.slice(1).toLowerCase()); // Format to "Primary" or "Secondary"
      } else {
        console.log('Invalid key type. Please enter "Primary" or "Secondary".');
        rlKeyType.close();
        resolve(promptForKeyType(credentialManager)); // Recursive call to prompt again
      }
    });
  });
}
