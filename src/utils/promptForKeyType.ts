import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';

export async function promptForKeyType(credentialManager: CredentialManager, rl?: readline.Interface) {
    // Ensure the readline interface is available or created if not passed as an argument.
    let readlineInterface:any = rl ;
    let createdInternally = false;

    if (!readlineInterface) {
        const interfaceCreationResult = createReadlineInterface();
        if (interfaceCreationResult.status) {
            readlineInterface = interfaceCreationResult.interfaceInstance as any; 
            createdInternally = true; // Flag to indicate the interface was created within this function
        } else {
            console.error(interfaceCreationResult.message);
            return Promise.resolve({ status: false, result: null, message: "Failed to create readline interface." });
        }
    }

    return new Promise((resolve) => {
        const keyTypeQuestion = 'Enter the key type ("Primary" or "Secondary") you want to retrieve (or type "exit" to return to the menu):\n ';

        readlineInterface.question(keyTypeQuestion, (input:any) => {
            if (input.toLowerCase() === "exit") {
                console.log('Exiting to main menu...');
                if (createdInternally) {
                    readlineInterface.close();
                }
                resolve({ status: false, result: null, message: "User exited." });
            } else if (["primary", "secondary"].includes(input.toLowerCase())) {
                if (createdInternally) {
                    readlineInterface.close();
                }
                let result = { status: true, result: input.charAt(0).toUpperCase() + input.slice(1).toLowerCase(), message: "Key type retrieved successfully." };
                resolve(result); // Format to "Primary" or "Secondary"
            } else {
                console.log('Invalid key type. Please enter "Primary" or "Secondary".');
                // Recursive call to prompt again without closing the readline interface
                resolve(promptForKeyType(credentialManager, readlineInterface));
            }
        });
    });
}
