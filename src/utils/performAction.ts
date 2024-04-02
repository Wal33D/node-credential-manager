import { promptForKeyType } from '../utils/promptForKeyType';
import { CredentialManager } from "../CredentialManager";
import { promptForServiceName } from '../utils/promptForServiceName';
import { findSpecificCredentialForService } from '../utils/findSpecificCredentialForService';
import { viewAllCredentials } from './viewAllCredentials';
import { promptForNewServiceName } from './promptForNewServiceName';
import { promptForCollectionDeletion } from './promptForCollectionDeletion';
import { promptForCollectionNameChange } from './promptForCollectionNameChange';
import { handleServiceAction } from './handleServiceAction';

export const performAction = async ({ action, readLineInterface, credentialManager, }: { action: string, readLineInterface?: any, credentialManager: CredentialManager, }): Promise<{ status: boolean, message: string, continueApp: boolean }> => {
    let status = false;
    let message = '';
    let continueApp = true;

    try {
        switch (action) {

            case '3':
                const viewCredentialsResult = await viewAllCredentials({ credentialManager, readLineInterface });
                console.log(viewCredentialsResult.credentialsMessage);
                break;
            case '4':
            case '5':
                const serviceActionResult = await handleServiceAction({ action, readLineInterface, credentialManager });
                console.log(serviceActionResult.message);
                console.log(`- Service: ${serviceActionResult.serviceName} | Status: ${serviceActionResult.status}\n`);
                console.log(serviceActionResult.credential);
                status = serviceActionResult.status;
                message = serviceActionResult.message;
                break;
            case '6':
                const initResult = await credentialManager.createCredentialsCollection(credentialManager.collectionName);
                console.log(initResult.message);
                status = initResult.status;
                message = initResult.message;
                break;
            case '7':
                const serviceNameResult = await promptForNewServiceName({ credentialManager, readLineInterface }) as any
                const addServiceResult = await credentialManager.addService(serviceNameResult.serviceName);
                console.log(addServiceResult.message);
                status = addServiceResult.status;
                message = addServiceResult.message;

                break;
            case '8':
                const collectionNameChangeResult = await promptForCollectionNameChange({ credentialManager, readLineInterface });
                console.log(collectionNameChangeResult.message);
                status = collectionNameChangeResult.status;
                message = collectionNameChangeResult.message;
                break;

            case '9':
                const deleteProcessResult = await promptForCollectionDeletion({ credentialManager, readLineInterface });
                console.log(deleteProcessResult.message);
                status = deleteProcessResult.status;
                message = deleteProcessResult.message;
                break;

            case '10':
                const resetResult = credentialManager.setCollectionName();
                console.log(resetResult.message);
                status = resetResult.status;
                message = resetResult.message;
                break;

            case '11': // Updated case number for exiting
                console.log('Exiting...');
                return { status: true, message: 'Exit option selected', continueApp: false };

            default:
                console.log('Invalid option selected. Please try again.');
                message = 'Invalid option selected';
                status = true;
        }
    } catch (error: any) {
        message = `An error occurred: ${error.message}`;
    } finally {
        readLineInterface.close();
    }

    return { status, message, continueApp };
};
