import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';

export const promptForNewServiceName = async ({
    credentialManager,
    readLineInterface
}: {
    credentialManager: CredentialManager,
    readLineInterface?: readline.Interface
}): Promise<{ status: boolean; serviceName?: string; message: string; continueApp: boolean; }> => {
    let readlineInterface: any = readLineInterface;
    let createdInternally = false;

    if (!readlineInterface) {
        const interfaceCreationResult = createReadlineInterface();
        if (interfaceCreationResult.status) {
            readlineInterface = interfaceCreationResult.interfaceInstance;
            createdInternally = true;
        } else {
            console.error(interfaceCreationResult.message); // Early feedback if the readline interface cannot be created
            return { status: false, message: interfaceCreationResult.message, continueApp: false };
        }
    }

    const promptLoop = async (): Promise<{ status: boolean; serviceName?: string; message: string; continueApp: boolean; }> => {
        return new Promise((resolve) => {
            const question = 'Enter the name of the new service you want to add (or type "exit" to return to the menu):\n';
            readlineInterface.question(question, async (input: string) => {
                let message = ''; // Reset message for each iteration
                if (input.toLowerCase() === "exit") {
                    message = 'Exiting to main menu...';
                    resolve({ status: false, message, continueApp: false });
                } else if (input.includes(' ')) {
                    message = "Service name should not contain spaces. Please try again.";
                    console.log(message); // Immediate feedback before re-prompting
                    resolve(await promptLoop());
                } else {
                    // Ensure database connection is initialized
                    await credentialManager.ensureDBInit();
                    if (!credentialManager.dbConnection) {
                        message = "Database connection is not initialized.";
                        console.log(message); // Immediate feedback if DB connection isn't initialized
                        resolve({ status: false, message, continueApp: false });
                    } else {
                        const dbCollection = credentialManager.dbConnection.collection(credentialManager.collectionName);
                        const serviceExists = await dbCollection.findOne({ name: input });
                        if (serviceExists) {
                            message = `Service '${input}' already exists. Please try again.`;
                            console.log(message); // Immediate feedback if service exists
                            resolve(await promptLoop());
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
