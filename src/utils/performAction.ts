import { promptForKeyType } from '../utils/promptForKeyType';
import { CredentialManager } from "../CredentialManager";
import { promptForServiceName } from '../utils/promptForServiceName';
import { findSpecificKeyForService } from '../utils/findSpecificKeyForService';
import { viewAllCredentials } from './viewAllCredentials';
import { ViewCredentialsResult } from '../types';
import { PromptForKeyTypeResult } from '../types';

export const performAction = async ({
    credentialManager,
    action,
    readLineInterface
}: {
    credentialManager: CredentialManager,
    action: string,
    readLineInterface: any
}): Promise<{ status: boolean, message: string, continueApp: boolean }> => {
    let status = false;
    let message = '';
    let continueApp = true;

    try {
        switch (action) {
            case '3':
                const viewCredentialsResult: ViewCredentialsResult = await viewAllCredentials({ credentialManager, readLineInterface: readLineInterface });
                console.log(viewCredentialsResult.credentialsMessage);
                break;
            case '4':
                const serviceNameResult = await promptForServiceName({ credentialManager, readLineInterface }) as any;
                if (!serviceNameResult || serviceNameResult.status === false) {
                    console.log(serviceNameResult ? serviceNameResult.message : 'Exiting to main menu...');
                    status = true;
                    message = '';
                }

                let keyTypeResult: PromptForKeyTypeResult;
                let findKeyResult = { status: false, credential: null, message: '' };

                while (!findKeyResult.status) {
                    keyTypeResult = await promptForKeyType(credentialManager, readLineInterface);
                    if (!keyTypeResult || keyTypeResult.status === false || keyTypeResult.result?.toLowerCase() === "back") {
                        console.log(keyTypeResult ? keyTypeResult.message : 'Exiting to main menu...');
                        status = true;
                        message = '';
                    }

                    findKeyResult = await findSpecificKeyForService({
                        serviceName: serviceNameResult.serviceNameKey,
                        keyType: keyTypeResult.result as any,
                        dbConnection: credentialManager.dbConnection
                    });

                    if (!findKeyResult.status) {
                        console.log(findKeyResult.message);
                    }
                }
                console.log('Key details:', findKeyResult.credential);
                break;
            case '5':
                const serviceResult = await promptForServiceName({ credentialManager, readLineInterface }) as any;
                message = serviceResult.message;
                status = serviceResult.status;

                console.log(`- Service: ${serviceResult.serviceNameKey} | Status: ${status}\n- Message: ${message}\n`);
                console.log(serviceResult.value);
                break;
            case '6':
                console.log('Exiting...');
                status = true;
                message = 'Exit option selected';
                continueApp = false;
                break;
            case '7':
                const initResult = await credentialManager.initializeCredentialsCollection('testKeys'); // Use your collection name
                console.log(initResult.message);
                status = initResult.status;
                message = initResult.message;
                break;

            default:
                console.log('Invalid option selected. Please try again.');
                status = true;
                message = 'Invalid option selected';
        }
    } catch (error: any) {
        message = `An error occurred: ${error.message}`;
        continueApp = true;
    } finally {
        readLineInterface.close();
    }

    return { status, message, continueApp };
};
