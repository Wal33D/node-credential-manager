import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';
import { ReadlineInterfaceResult } from '../types';
import { promptForKeyType } from './promptForKeyType';
import { findSpecificKeyForService } from './findSpecificKeyForService';

export const promptForSpecificKey = async ({ credentialManager, readLineInterface }: { credentialManager: CredentialManager, readLineInterface?: readline.Interface }): Promise<{ status: boolean; message: string; credential?: any }> => {
    let readlineInterface: any = readLineInterface;
    let createdInternally = false;
    let message = ''; // Initialize message variable for dynamic updates

    if (!readlineInterface) {
        const interfaceCreationResult: ReadlineInterfaceResult = createReadlineInterface();
        if (!interfaceCreationResult.status) {
            message = interfaceCreationResult.message;
            console.error(message); // Provide immediate feedback if unable to create readline interface
            return { status: false, message };
        }
        readlineInterface = interfaceCreationResult.interfaceInstance as readline.Interface;
        createdInternally = true;
    }

    try {
        const serviceNameQuestion = 'Enter the service name you want to retrieve the key for (or type "exit" to return to the menu):\n ';
        const serviceName = await new Promise<string | null>((resolve) => {
            readlineInterface!.question(serviceNameQuestion, (input: string) => {
                if (input.toLowerCase() === "exit") {
                    message = 'Exiting to main menu...';
                    console.log(message); // Provide immediate feedback for exit
                    resolve(null);
                } else {
                    resolve(input);
                }
            });
        });

        if (!serviceName) {
            return { status: true, message: 'User exited to main menu.', credential: null };
        }

        const keyType = await promptForKeyType({credentialManager, readLineInterface});
        if (!keyType.status) {
            return { status: false, message: keyType.message, credential: null }; // Use the message from promptForKeyType
        }

        const keySearchResult = await findSpecificKeyForService({
            serviceName: serviceName,
            credentialName: keyType.result!,
            dbConnection: credentialManager.dbConnection as any,
        });

        if (!keySearchResult.status) {
            return { status: false, message: keySearchResult.message, credential: null };
        }

        // If everything goes well, return success status, message, and credential
        return { status: true, message: 'Key retrieved successfully.', credential: { name: keySearchResult?.credential?.name, value: keySearchResult?.credential?.value } };
    } catch (error: any) {
        message = `An error occurred: ${error.message}`;
        console.error(message); // Provide immediate feedback for error
        return { status: false, message };
    } finally {
        if (createdInternally && readlineInterface) {
            readlineInterface.close();
        }
    }
}
