import { promptForKeyType } from '../utils/promptForKeyType';
import { CredentialManager } from "../CredentialManager";
import { promptForServiceName } from '../utils/promptForServiceName';
import { findSpecificCredentialForService } from '../utils/findSpecificCredentialForService';
import { viewAllCredentials } from './viewAllCredentials';
import { promptForNewServiceName } from './promptForNewServiceName';
import { promptForNewCollectionName } from './promptForNewCollectionName';
import { promptForCollectionDeletion } from './promptForCollectionDeletion';
import { promptForCollectionNameChange } from './promptForCollectionNameChange';
import { handleServiceCredentialsInteraction } from './handleServiceCredentialsInteraction';

export const performAction = async ({ action, readLineInterface, credentialManager, }: { action: string, readLineInterface?: any, credentialManager: CredentialManager, }): Promise<{ status: boolean, message: string, continueApp: boolean }> => {
    let status = false;
    let message = '';
    let continueApp = true;

    try {
        switch (action) {
            case '1': // Initialize DB with default structure
                const initResult = await credentialManager.createCredentialsCollection(credentialManager.collectionName);
                console.log(initResult.message);
                status = initResult.status;
                message = initResult.message;
                break;
            case '2': // Create and Switch to a collection
                const collectionNameChangeResult = await promptForCollectionNameChange({ credentialManager, readLineInterface });
                console.log(collectionNameChangeResult.message);
                status = collectionNameChangeResult.status;
                message = collectionNameChangeResult.message;
                break;
            case '3': // Delete a collection
                const deleteProcessResult = await promptForCollectionDeletion({ credentialManager, readLineInterface });
                console.log(deleteProcessResult.message);
                status = deleteProcessResult.status;
                message = deleteProcessResult.message;
                break;
            case '4': // Reset collection name to default
                const resetResult = credentialManager.resetCollectionNameToDefault();
                console.log(resetResult.message);
                status = resetResult.status;
                message = resetResult.message;
                break;
            // Integration within the switch case of performAction:
            case '5':
                const serviceCredentialsInteractionResult = await handleServiceCredentialsInteraction({ readLineInterface, credentialManager });
                console.log(serviceCredentialsInteractionResult.message);
                status = serviceCredentialsInteractionResult.status;
                message = serviceCredentialsInteractionResult.message;
                break;
            case '6':
                const viewCredentialsResult = await viewAllCredentials({ credentialManager, readLineInterface });
                console.log(viewCredentialsResult.credentialsMessage);
                break;
5
            case '9': // Add a new service
                const serviceNameResult = await promptForNewServiceName({ credentialManager, readLineInterface }) as any
                const addServiceResult = await credentialManager.addService(serviceNameResult.serviceName);
                console.log(addServiceResult.message);
                status = addServiceResult.status;
                message = addServiceResult.message;
                break;

                break;
            case '10': // Updated case number for exiting
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
