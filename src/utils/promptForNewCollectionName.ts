import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';

export const promptForNewCollectionName = async ({ credentialManager, readLineInterface }: { credentialManager: CredentialManager, readLineInterface?: readline.Interface }): Promise<{ status: boolean; newName?: string; message: string; }> => {
    let createdInternally = false;

    if (!readLineInterface) {
        const interfaceCreationResult = createReadlineInterface();
        if (interfaceCreationResult.status) {
            readLineInterface = interfaceCreationResult.interfaceInstance as any;
            createdInternally = true;
        } else {
            console.error(interfaceCreationResult.message);
            return { status: false, message: interfaceCreationResult.message };
        }
    }

    const promptLoop = async (): Promise<{ status: boolean; newName?: string; message: string; }> => {
        return new Promise((resolve) => {
            const question = 'Enter the new collection name you want to set (or type "exit" to return to the menu):\n';
            const askQuestion = () => { // Modified to re-prompt using a function
                readLineInterface!.question(question, (input: string) => {
                    if (input.toLowerCase() === "exit") {
                        resolve({ status: false, message: 'Exiting to main menu...' });
                    } else if (input === '') {
                        console.log(" - Hint:  name cannot be empty. Please try again."); // Immediate feedback before re-prompting
                        askQuestion(); // Re-ask the question without resolving
                    } else if (input.includes(' ')) {
                        console.log(" - Hint:  name should not contain spaces. Please try again."); // Immediate feedback
                        askQuestion(); // Re-ask the question without resolving
                    } else {
                        resolve({ status: true, newName: input, message: 'Collection name received.' });
                    }
                });
            };
            askQuestion(); // Initial call to start the loop
        });
    };

    const result = await promptLoop();

    if (createdInternally && readLineInterface) {
        readLineInterface.close();
    }

    return result;
};
