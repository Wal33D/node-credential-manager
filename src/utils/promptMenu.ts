import readline from 'readline';
import { createReadlineInterface } from './createReadlineInterface';

export const promptMenu = async ({ readLineInterface }: { readLineInterface?: readline.Interface }): Promise<{ status: boolean; choice: string; message: string; }> => {
    let createdInternally = false;
    let status = false;
    let choice = '';
    let message = 'Failed to receive input';

    if (!readLineInterface) {
        const interfaceCreationResult = createReadlineInterface();
        if (!interfaceCreationResult.status) {
            message = interfaceCreationResult.message;
            console.error(message);
            return { status, choice, message };
        }
        readLineInterface = interfaceCreationResult.interfaceInstance as readline.Interface;
        createdInternally = true;
    }

    try {
        choice = await new Promise((resolve) => {
            // Use the reassigned readLineInterface with non-null assertion here, since we know it's not null
            readLineInterface!.question(
                'What would you like to do next?\n' +
                ' 1. Add a new credential\n' +
                ' 3. View all credentials\n' +
                ' 4. Search for a specific key\n' +
                ' 5. Search by credential name\n' +
                ' 6. Initialize DB with default structure\n' +
                ' 7. Add a new credential\n' +
                ' 8. Create and Switch to a collection\n' +
                ' 9. Delete a collection\n' +
                '10. Reset collection name to default\n' + // New option for resetting collection name
                '11. Exit\n' + // Adjusted for new option
                'Please enter your choice (1-11):\n',
                (answer: string) => {
                    resolve(answer); 
                }
            );
        });
        status = true;
        message = 'Input received successfully';
    } catch (error: any) {
        status = false;
        message = `Error: ${error.message}`;
    }

    // Close the interface if it was created internally
    if (createdInternally) {
        readLineInterface!.close();
    }

    return { status, choice, message };
};
