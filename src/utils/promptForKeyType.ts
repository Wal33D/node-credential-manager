import readline from 'readline';
import { PromptForKeyTypeResult } from '../types';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';

export async function promptForKeyType(credentialManager: CredentialManager, readLineInterface?: readline.Interface): Promise<PromptForKeyTypeResult> {
    let readlineInterface: readline.Interface | null = readLineInterface ?? null;
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
        return await new Promise<PromptForKeyTypeResult>((resolve) => {
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
                    resolve(promptForKeyType(credentialManager, readlineInterface as any));
                }
            });
        });
    } finally {
        if (createdInternally && readlineInterface) {
            readlineInterface.close();
        }
    }
}
