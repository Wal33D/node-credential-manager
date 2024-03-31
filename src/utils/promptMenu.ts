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
            readLineInterface!.question(
                'What would you like to do next?\n' +
                '\n[Database Operations]\n' +
                ' 1. Initialize DB with default structure\n' +
                ' 2. Create and Switch to a collection\n' +
                ' 3. Delete a collection\n' +
                ' 4. Reset collection name to default\n' +
                '\n[Credential Management]\n' +
                ' 5. Add a new credential\n' +
                ' 6. View all credentials\n' +
                ' 7. Search for a specific key\n' +
                ' 8. Search by service name\n' +
                '\n[Service Management]\n' +
                ' 9. Add a new service\n' +
                '\n[General Options]\n' +
                '10. Exit\n' +
                '\nPlease enter your choice (1-10):\n',
                (answer) => {
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
