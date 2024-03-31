import { promptForKeyType } from '../utils/promptForKeyType';
import { CredentialManager } from "../CredentialManager";
import { promptForServiceName } from '../utils/promptForServiceName';
import { findSpecificCredentialForService } from '../utils/findSpecificCredentialForService';
import { viewAllCredentials } from './viewAllCredentials';
import { promptForNewServiceName } from './promptForNewServiceName';

const collectionName = 'CredentialManager';
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
                const serviceActionHandler = async () => {
                    const serviceNameResult: any = await promptForServiceName({ credentialManager, readLineInterface });
                    if (!serviceNameResult || !serviceNameResult.status) {
                        console.log(serviceNameResult?.message || 'Exiting to main menu...');
                        return { status: true, message: '' };
                    }
                    if (action === '5') {
                        console.log(`- Service: ${serviceNameResult.serviceName} | Status: ${serviceNameResult.status}\n- Message: ${serviceNameResult.message}\n`);
                        return serviceNameResult;
                    }

                    let keyTypeResult;
                    do {
                        keyTypeResult = await promptForKeyType({credentialManager, readLineInterface});
                        if (!keyTypeResult || !keyTypeResult.status || keyTypeResult.result?.toLowerCase() === "back") {
                            console.log(keyTypeResult?.message || 'Exiting to main menu...');
                            return { status: true, message: '' };
                        }
                        const findKeyResult = await findSpecificCredentialForService({
                            serviceName: serviceNameResult.serviceName,
                            credentialName: keyTypeResult.result as any,
                            dbConnection: credentialManager.dbConnection as any,
                        });
                        console.log(findKeyResult.message);
                        if (findKeyResult.status) console.log(findKeyResult.credential);
                    } while (!keyTypeResult.status);

                    return keyTypeResult;
                };
                ({ status, message } = await serviceActionHandler());
                break;
            case '6':
                const initResult = await credentialManager.createCredentialsCollection(collectionName);
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

                case '8': // This now corresponds to changing the collection name
                const newCollectionName = await promptForNewCollectionName({ credentialManager, readLineInterface });
                const { oldName, newName } = credentialManager.setCollectionName(newCollectionName);
                console.log(`Collection name changed from '${oldName}' to '${newName}'.`);
                status = true;
                message = `Collection name changed successfully.`;
                break;

            case '9': // Updated to '9' for exiting
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


