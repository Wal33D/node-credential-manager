import readline from 'readline';
import { createReadlineInterface } from './createReadlineInterface';
import { ReadlineInterfaceResult } from '../types';

export const promptForNewServiceName = async ({
    readLineInterface
}: {
    readLineInterface?: readline.Interface
}): Promise<{ status: boolean; serviceName?: string; message: string; continueApp: boolean; }> => {
    let message = 'Failed to prompt for new service name.';
    let status = false;
    let serviceName: string | undefined = undefined;
    let continueApp = true; // Default to true, indicating the app should continue.

    try {
        let readlineInterface: readline.Interface | undefined = readLineInterface;
        let createdInternally = false;

        if (!readlineInterface) {
            const interfaceCreationResult: ReadlineInterfaceResult = createReadlineInterface();
            if (!interfaceCreationResult.status) {
                throw new Error(interfaceCreationResult.message);
            }
            readlineInterface = interfaceCreationResult.interfaceInstance;
            createdInternally = true;
        }

        serviceName = await new Promise<string | undefined>((resolve, reject) => {
            const question = 'Enter the name of the new service you want to add:\n';

            readlineInterface?.question(question, (input: string) => {
                if (input.toLowerCase() === "exit") {
                    console.log('Exiting to main menu...');
                    continueApp = false; // Set continueApp to false when user types "exit".
                    resolve(undefined); // Resolve with undefined to indicate cancellation.
                } else {
                    resolve(input); // Resolve with the actual service name.
                }
            });
        });

        if (!serviceName && !continueApp) {
            message = 'Exited to main menu.';
        } else if (serviceName) {
            status = true;
            message = 'Service name received.';
        }

        if (createdInternally && readlineInterface) {
            readlineInterface.close();
        }
    } catch (error: any) {
        message = `Error: ${error.message}`;
        continueApp = false; // In case of an error, potentially stop the application.
    }

    return { status, serviceName, message, continueApp };
}
