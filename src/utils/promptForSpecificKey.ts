import readline from 'readline';
import { promptForKeyType } from './promptForKeyType';
import { CredentialManager } from "../CredentialManager";
import { findSpecificKeyForService } from './findSpecificKeyForService';

export const promptForSpecificKey = async ({ credentialManager, rl }: { credentialManager: CredentialManager; rl: readline.Interface; }): 
Promise<{ status: boolean; message: string; credential?: any }> => {
    let message = '';    
    let status = false;
    let credential = null;

    try {
        const serviceNameQuestion = 'Enter the service name you want to retrieve the key for (or type "exit" to return to the menu):\n ';
        const serviceName = await new Promise((resolve) => {
            rl.question(serviceNameQuestion, (input) => {
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

        while (true) {
            const keyType = await promptForKeyType(credentialManager, rl);
            if (!keyType) {
                return { status: true, message: 'User exited to main menu', credential: null };
            }

            const keySearchResult = await findSpecificKeyForService({
                serviceName: serviceName as any,
                keyType: keyType as any,
                dbConnection: credentialManager.dbConnection
            });

            console.log(keySearchResult.message);

            if (keySearchResult.status) {
                return { status: true, message: 'Key retrieved successfully.', credential: keySearchResult.credential };
            } else if (keySearchResult.message.includes("However, a")) {
                const tryAlternativeKey = await new Promise((resolve) => {
                    rl.question("Do you want to try for the alternative key? (yes/no): ", (input) => {
                        resolve(input.toLowerCase() === "yes");
                    });
                });

                if (!tryAlternativeKey) {
                    console.log("No key retrieved. Exiting to main menu.");
                    return { status: true, message: 'No key retrieved. User exited to main menu.', credential: null };
                }
            } else {
                return { status: false, message: 'No key retrieved.', credential: null };
            }
        }
    } catch (error: any) {
        return { status: false, message: `An error occurred: ${error.message}` };
    }
};
