import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';

export const promptForKeyType = async ({ credentialManager, readLineInterface }: { credentialManager: CredentialManager, readLineInterface?: readline.Interface }): Promise<{ status: boolean; result?: string; message: string; }> => {
    let readlineInterface: any = readLineInterface;
    let createdInternally = false;

    if (!readlineInterface) {
        const interfaceCreationResult = createReadlineInterface();
        if (!interfaceCreationResult.status) {
            console.error(interfaceCreationResult.message);
            return { status: false, message: "Failed to create readline interface." };
        }
        readlineInterface = interfaceCreationResult.interfaceInstance as readline.Interface;
        createdInternally = true;
    }

    try {
        return await new Promise<any>((resolve) => {
            const keyTypeQuestion = 'Enter the key type ("Primary" or "Secondary") you want to retrieve (or type "exit" to return to the menu):\n';
            readlineInterface!.question(keyTypeQuestion, (input: string) => {
                if (input.toLowerCase() === "exit") {
                    console.log('Exiting to main menu...');
                    resolve({ status: false, message: "User exited." });
                } else if (["primary", "secondary"].includes(input.toLowerCase())) {
                    resolve({
                        status: true,
                        result: input.charAt(0).toUpperCase() + input.slice(1).toLowerCase(),
                        message: "Key type retrieved successfully."
                    });
                } else {
                    console.log('Invalid key type. Please enter "Primary" or "Secondary".');
                    resolve(promptForKeyType({credentialManager, readLineInterface }));
                }
            });
        });
    } finally {
        if (createdInternally && readlineInterface) {
            readlineInterface.close();
        }
    }
}
