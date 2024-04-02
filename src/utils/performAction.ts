import { CredentialManager } from "../CredentialManager";
import { viewAllCredentials } from './viewAllCredentials';
import { promptForNewServiceName } from './promptForNewServiceName';
import { handleServiceAction } from './handleServiceAction';
import { promptForNewCollectionName } from "./promptForNewCollectionName";
import { promptForKeyName } from "./promptForKeyName";
import { promptForKeyValue } from "./promptForKeyValue";

export const performAction = async ({ action, readLineInterface, credentialManager, }: { action: string, readLineInterface?: any, credentialManager: CredentialManager, }): Promise<{ status: boolean, message: string, continueApp: boolean }> => {
    let status = false;
    let message = '';
    let continueApp = true;

    try {
        switch (action) {
            case '2':
                const keyResult = await promptForKeyName(readLineInterface);
                if (!keyResult.status) {
                    message = keyResult.message;
                    break;
                }

                const valueResult = await promptForKeyValue(readLineInterface);
                if (!valueResult.status) {
                    message = valueResult.message;
                    break;
                }

                console.log(`Key '${keyResult.key}' with value '${valueResult.value}' is ready for processing.`);
                status = true;
                message = "Key and value received.";
                break;
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
                const initResult = await credentialManager.createCabinet();
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
                const newNameResult = await promptForNewCollectionName({ credentialManager, readLineInterface });
                const collectionNameChangeResult = await credentialManager.createCabinet(newNameResult.newName);
                console.log(collectionNameChangeResult.message);
                status = collectionNameChangeResult.status;
                message = collectionNameChangeResult.message;
                break;

            case '9':
                const {newName:cabinetName} = await promptForNewCollectionName({ credentialManager, readLineInterface });
                const deleteProcessResult = await credentialManager.deleteCabinet(cabinetName );
                console.log(deleteProcessResult.message);
                status = deleteProcessResult.status;
                message = deleteProcessResult.message;
                break;

            case '10':
                const resetResult = await credentialManager.createCabinet();
                console.log(resetResult.message);
                status = resetResult.status;
                message = resetResult.message;
                break;

            case '11':
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
