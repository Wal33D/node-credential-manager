import readline from 'readline';
import { createReadlineInterface } from './createReadlineInterface';
import { ReadlineInterfaceResult } from '../types';

export const promptForNewServiceName = async ({
    readLineInterface,
    credentialManager 
}: {
    readLineInterface?: readline.Interface | any,
    credentialManager: any 
}): Promise<{ status: boolean; serviceName?: string; message: string; continueApp: boolean; }> => {
    let message = 'Failed to prompt for new service name.';
    let status = false;
    let serviceName: string | undefined = undefined;
    let continueApp = true;

    try {
        let readlineInterface: readline.Interface | any;
        let createdInternally = false;

        if (!readlineInterface) {
            const interfaceCreationResult: ReadlineInterfaceResult = createReadlineInterface();
            if (!interfaceCreationResult.status) {
                throw new Error(interfaceCreationResult.message);
            }
            readlineInterface = interfaceCreationResult.interfaceInstance;
            createdInternally = true;
        }

        // Ensure database connection is initialized
        await credentialManager.ensureDBInit();
        if (!credentialManager.dbConnection) {
            throw new Error("Database connection is not initialized.");
        }

        serviceName = await new Promise<string | undefined>((resolve) => {
            const question = 'Enter the name of the new service you want to add:\n';
            readlineInterface?.question(question, async (input: string) => {
                if (input.toLowerCase() === "exit") {
                    console.log('Exiting to main menu...');
                    continueApp = false;
                    resolve(undefined);
                } else if (input.includes(' ')) {
                    message = "Service name should not contain spaces. Please try again with a valid name.";
                    resolve(undefined);
                } else {
                    // Check if service already exists
                    const dbCollection = credentialManager.dbConnection.collection(credentialManager.collectionName);
                    const serviceExists = await dbCollection.findOne({ name: input });
                    if (serviceExists) {
                        message = `Service '${input}' already exists in the '${credentialManager.collectionName}' collection.`;
                        resolve(undefined);
                    } else {
                        status = true;
                        message = 'Service name validated and ready for addition.';
                        resolve(input);
                    }
                }
            });
        });

        if (!serviceName && !continueApp) {
            message = 'Exited to main menu or validation failed.';
        }

        if (createdInternally && readlineInterface) {
            readlineInterface.close();
        }
    } catch (error: any) {
        message = `Error: ${error.message}`;
        continueApp = false;
    }

    return { status, serviceName, message, continueApp };
}
