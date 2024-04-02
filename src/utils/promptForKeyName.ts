import readline from 'readline';
import { createReadlineInterface } from './createReadlineInterface';

export const promptForKeyName = async (readLineInterface?: readline.Interface): Promise<{ status: boolean; key?: string; message: string; }> => {
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

    const promptLoop = async (): Promise<{ status: boolean; key?: string; message: string; }> => {
        return new Promise((resolve) => {
            const question = 'Enter the key name (or type "exit" to return to the menu):\n';
            const askQuestion = () => {
                readLineInterface!.question(question, (input: string) => {
                    if (input.toLowerCase() === "exit") {
                        resolve({ status: false, message: 'Exiting to main menu...' });
                    } else if (!input.trim()) {
                        console.log(" - Hint: Key name cannot be empty. Please try again.");
                        askQuestion();
                    } else if (input.includes(' ')) {
                        console.log(" - Hint: Key name should not contain spaces. Please try again.");
                        askQuestion();
                    } else {
                        resolve({ status: true, key: input.trim(), message: 'Key name received.' });
                    }
                });
            };
            askQuestion();
        });
    };

    const result = await promptLoop();

    if (createdInternally && readLineInterface) {
        readLineInterface.close();
    }

    return result;
};
