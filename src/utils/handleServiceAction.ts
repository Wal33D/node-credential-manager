// File: ./serviceActions.js
import { promptForKeyType } from '../utils/promptForKeyType';
import { promptForServiceName } from '../utils/promptForServiceName';
import { findSpecificCredentialForService } from '../utils/findSpecificCredentialForService';

export async function handleServiceAction({
    action,
    readLineInterface,
    credentialManager,
}: {
    action: any,
    readLineInterface: any,
    credentialManager: any,
}) {
    const serviceNameResult = await promptForServiceName({ credentialManager, readLineInterface });
    if (!serviceNameResult || !serviceNameResult.status) {
        return { status: false, message: serviceNameResult?.message || 'Exiting to main menu...' };
    }

    if (action === '5') {
        // For action '5', return after fetching service name.
        return { status: true, message: 'Service name retrieved successfully.', serviceName: serviceNameResult.serviceName, credentials:serviceNameResult.credentials };
    }

    // Proceed with fetching the key for action '4'.
    let keyTypeResult;
    do {
        keyTypeResult = await promptForKeyType({ credentialManager, readLineInterface });
        if (!keyTypeResult || !keyTypeResult.status || keyTypeResult.result?.toLowerCase() === "back") {
            return { status: false, message: keyTypeResult?.message || 'Exiting to main menu...' };
        }

        const findKeyResult = await findSpecificCredentialForService({
            serviceName: serviceNameResult.serviceName as any,
            credentialName: keyTypeResult.result as any,
            dbConnection: credentialManager.dbConnection,
        });

        if (findKeyResult.status) {
            return { status: true, message: 'Credential retrieved successfully.',serviceName:serviceNameResult.serviceName, credential: findKeyResult.credential };
        }
    } while (!keyTypeResult.status);

    return { status: false, message: 'Failed to retrieve credential.' };
}
