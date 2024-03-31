import readline from 'readline';
import { CredentialManager } from "../CredentialManager";
import { createReadlineInterface } from './createReadlineInterface';
import { SpecificKeySearchResult } from '../types'; 
import { promptForKeyType } from './promptForKeyType';
import { findSpecificKeyForService } from './findSpecificKeyForService';

export async function promptForSpecificKey(credentialManager: CredentialManager, rl?: readline.Interface): 
Promise<{ status: boolean; message: string; credential?: any }> {
    let readlineInterface: readline.Interface | null = rl ?? null;
    let createdInternally = false;

    if (!readlineInterface) {
        const interfaceCreationResult: ReadlineInterfaceResult = createReadlineInterface();
        if (!interfaceCreationResult.status) {
            console.error(interfaceCreationResult.message);
            return { status: false, message: "Failed to create readline interface." };
        }
        readlineInterface = interfaceCreationResult.interfaceInstance as readline.Interface;
        createdInternally = true;
    }

    try {
        const serviceNameQuestion = 'Enter the service name you want to retrieve the key for (or type "exit" to return to the menu):\n ';
        const serviceName = await new Promise<string | null>((resolve) => {
            readlineInterface!.question(serviceNameQuestion, (input: string) => {
                if (input.toLowerCase() === "exit") {
                    console.log('Exiting to main menu...');
                    resolve(null);
                } else {
                    resolve(input);
                }
            });
        });

        if (!serviceName) {
            return { status: true, message: 'User exited to main menu', credential: null };
        }

        const keyType: PromptForKeyTypeResult = await promptForKeyType(credentialManager, readlineInterface);
        if (!keyType.status) {
            return { status: true, message: 'User exited to main menu', credential: null };
        }

        const keySearchResult: SpecificKeySearchResult = await findSpecificKeyForService({
            serviceName: serviceName,
            keyType: keyType.result!,
            dbConnection: credentialManager.dbConnection
        });

        console.log(keySearchResult.message);

        if (keySearchResult.status) {
            return { status: true, message: 'Key retrieved successfully.', credential: keySearchResult.credential };
        } else {
            return { status: false, message: 'No key retrieved.', credential: null };
        }
    } catch (error: any) {
        return { status: false, message: `An error occurred: ${error.message}` };
    } finally {
        if (createdInternally && readlineInterface) {
            readlineInterface.close();
        }
    }
}
