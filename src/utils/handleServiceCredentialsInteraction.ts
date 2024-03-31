import { promptForKeyType } from '../utils/promptForKeyType';
import { CredentialManager } from "../CredentialManager";
import { promptForServiceName } from '../utils/promptForServiceName';
import { findSpecificCredentialForService } from '../utils/findSpecificCredentialForService';

export async function handleServiceCredentialsInteraction({ readLineInterface, credentialManager }: { readLineInterface: any, credentialManager: CredentialManager }): Promise<{ status: boolean, message: string }> {
    const serviceNameResult = await promptForServiceName({ credentialManager, readLineInterface });
    if (!serviceNameResult || !serviceNameResult.status) {
        return { status: false, message: serviceNameResult?.message || 'Service name retrieval failed or was cancelled.' };
    }

    // If the action specifically requires working with the credentials of a service:
    console.log(`- Service: ${serviceNameResult.serviceName} | Status: ${serviceNameResult.status}\n- Message: ${serviceNameResult.message}\n`);
    if (serviceNameResult.serviceName) {
        let keyTypeResult;
        do {
            keyTypeResult = await promptForKeyType({ credentialManager, readLineInterface });
            if (!keyTypeResult || !keyTypeResult.status || keyTypeResult.result?.toLowerCase() === "back") {
                return { status: false, message: keyTypeResult?.message || 'Exiting to main menu.' };
            }
            
            const findKeyResult = await findSpecificCredentialForService({
                serviceName: serviceNameResult.serviceName,
                credentialName: keyTypeResult.result as any,
                dbConnection: credentialManager.dbConnection as any,
            });
            console.log(findKeyResult.message);
            if (findKeyResult.status) {
                console.log(findKeyResult.credential);
                return { status: true, message: 'Credential retrieved successfully.' };
            }
        } while (!keyTypeResult.status);
    }

    return { status: false, message: 'Operation completed with issues.' };
}