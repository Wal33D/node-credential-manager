import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';
import { promptForKeyType } from './promptForKeyType';
import { findSpecificCredentialForCredential } from './findSpecificCredentialForCredential';

export const promptForSpecificKey = async ({ credentialManager, readLineInterface }: { credentialManager: CredentialManager, readLineInterface?: readline.Interface }): Promise<{ status: boolean; message: string; credential?: any }> => {
    let createdInternally = false;
    let message = ''; // Initialize message variable for dynamic updates

    if (!readLineInterface) {
        const interfaceCreationResult = createReadlineInterface();
        if (!interfaceCreationResult.status) {
            message = interfaceCreationResult.message;
            console.error(message); // Provide immediate feedback if unable to create readline interface
            return { status: false, message };
        }
        readLineInterface = interfaceCreationResult.interfaceInstance as readline.Interface;
        createdInternally = true;
    }

    try {
        const credentialNameQuestion = 'Enter the credential name you want to retrieve the key for (or type "exit" to return to the menu):\n ';
        const credentialName = await new Promise<string | null>((resolve) => {
            readLineInterface!.question(credentialNameQuestion, (input: string) => {
                if (input.toLowerCase() === "exit") {
                    message = 'Exiting to main menu...';
                    console.log(message); // Provide immediate feedback for exit
                    resolve(null);
                } else {
                    resolve(input);
                }
            });
        });

        if (!credentialName) {
            return { status: true, message: 'User exited to main menu.', credential: null };
        }

        const keyType = await promptForKeyType({credentialManager, readLineInterface});
        if (!keyType.status) {
            return { status: false, message: keyType.message, credential: null }; // Use the message from promptForKeyType
        }

        const keySearchResult = await findSpecificCredentialForCredential({
            credentialName: credentialName,
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
        if (createdInternally && readLineInterface) {
            readLineInterface.close();
        }
    }
}
