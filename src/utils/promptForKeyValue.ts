import readline from 'readline';
import { createReadlineInterface } from './createReadlineInterface';

export const promptForKeyValue = async (readLineInterface?: readline.Interface): Promise<{ status: boolean; value?: string; message: string; }> => {
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

    const promptLoop = async (): Promise<{ status: boolean; value?: string; message: string; }> => {
        return new Promise((resolve) => {
            const question = 'Enter the key value (or type "exit" to return to the menu):\n';
            readLineInterface!.question(question, (input: string) => {
                if (input.toLowerCase() === "exit") {
                    resolve({ status: false, message: 'Exiting to main menu...' });
                } else if (!input.trim()) {
                    console.log(" - Hint: Key value cannot be empty. Please try again.");
                    promptLoop().then(resolve);
                } else {
                    resolve({ status: true, value: input.trim(), message: 'Key value received.' });
                }
            });
        });
    };

    const result = await promptLoop();

    if (createdInternally && readLineInterface) {
        readLineInterface.close();
    }

    return result;
};
