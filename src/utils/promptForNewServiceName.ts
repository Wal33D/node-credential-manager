import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';

export const promptForNewServiceName = async ({
    credentialManager,
    readLineInterface
}: {
    credentialManager: CredentialManager,
    readLineInterface?: readline.Interface
}): Promise<{ status: boolean; serviceName?: string; message: string; continueApp: boolean; } | null> => {
    let readlineInterface: any = readLineInterface;
    let createdInternally = false;
    let message = 'Beginning service name validation...';

    if (!readlineInterface) {
        const interfaceCreationResult = createReadlineInterface();
        if (interfaceCreationResult.status) {
            readlineInterface = interfaceCreationResult.interfaceInstance;
            createdInternally = true;
        } else {
            console.error(interfaceCreationResult.message);
            return null;
        }
    }

    const promptLoop = async (): Promise<{ status: boolean; serviceName?: string; message: string; continueApp: boolean; } | null> => {
        return new Promise((resolve) => {
            const question = 'Enter the name of the new service you want to add (or type "exit" to return to the menu):\n';
            readlineInterface.question(question, async (input: string) => {
                if (input.toLowerCase() === "exit") {
                    message = 'Exiting to main menu...';
                    resolve({ status: false, message, continueApp: false });
                } else if (input.includes(' ')) {
                    message = "Service name should not contain spaces. Please try again.";
                    resolve(await promptLoop()); // Recursively call promptLoop for another attempt
                } else {
                    // Ensure database connection is initialized
                    await credentialManager.ensureDBInit();
                    if (!credentialManager.dbConnection) {
                        message = "Database connection is not initialized.";
                        resolve({ status: false, message: "Database connection is not initialized.", continueApp: false });
                    } else {
                        // Check if service already exists
                        const dbCollection = credentialManager.dbConnection.collection(credentialManager.collectionName);
                        const serviceExists = await dbCollection.findOne({ name: input });
                        if (serviceExists) {
                            message = `Service '${input}' already exists. Please try again.`;
                            resolve(await promptLoop()); // Recursively call promptLoop for another attempt
                        } else {
                            message = 'Service name validated and ready for addition.';
                            resolve({ status: true, serviceName: input, message, continueApp: true });
                        }
                    }
                }
            });
        });
    };

    const result = await promptLoop();

    if (createdInternally && readlineInterface) {
        readlineInterface.close();
    }

    return result;
}
