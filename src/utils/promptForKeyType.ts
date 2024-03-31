import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';

export async function promptForKeyType(credentialManager: CredentialManager, rl: readline.Interface = createReadlineInterface()) {
    return new Promise((resolve) => {
        const keyTypeQuestion = 'Enter the key type ("Primary" or "Secondary") you want to retrieve (or type "exit" to return to the menu): ';

        rl.question(keyTypeQuestion, (input) => {
            if (input.toLowerCase() === "exit") {
                console.log('Exiting to main menu...');
                // Check if no readline interface was passed as an argument
                if (arguments.length <= 1) {
                    rl.close();
                }
                resolve({ status: false, result: null, message: "fail" });
            } else if (["primary", "secondary"].includes(input.toLowerCase())) {
                // Check if no readline interface was passed as an argument
                if (arguments.length <= 1) {
                    rl.close();
                }
                let result = { status: true, result: input.charAt(0).toUpperCase() + input.slice(1).toLowerCase(), message: "success" };
                resolve(result); // Format to "Primary" or "Secondary"
            } else {
                console.log('Invalid key type. Please enter "Primary" or "Secondary".');
                // Recursive call to prompt again without closing the readline interface
                resolve(promptForKeyType(credentialManager, rl));
            }
        });
    });
}
