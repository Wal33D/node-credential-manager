// File: ./credentialActions.js
import { promptForKeyType } from '../utils/promptForKeyType';
import { promptForCredentialName } from '../utils/promptForCredentialName';
import { findSpecificCredentialForCredential } from '../utils/findSpecificCredentialForCredential';

export async function handleCredentialAction({
    action,
    readLineInterface,
    credentialManager,
}: {
    action: any,
    readLineInterface: any,
    credentialManager: any,
}) {
    const credentialNameResult = await promptForCredentialName({ credentialManager, readLineInterface });
    if (!credentialNameResult || !credentialNameResult.status) {
        return { status: false, message: credentialNameResult?.message || 'Exiting to main menu...' };
    }

    if (action === '5') {
        // For action '5', return after fetching credential name.
        return { status: true, message: 'Credential name retrieved successfully.', credentialName: credentialNameResult.credentialName, credentials:credentialNameResult.credentials };
    }

    // Proceed with fetching the key for action '4'.
    let keyTypeResult;
    do {
        keyTypeResult = await promptForKeyType({ credentialManager, readLineInterface });
        if (!keyTypeResult || !keyTypeResult.status || keyTypeResult.result?.toLowerCase() === "back") {
            return { status: false, message: keyTypeResult?.message || 'Exiting to main menu...' };
        }

        const findKeyResult = await findSpecificCredentialForCredential({
            credentialName: credentialNameResult.credentialName as any,
            credentialName: keyTypeResult.result as any,
            dbConnection: credentialManager.dbConnection,
        });

        if (findKeyResult.status) {
            return { status: true, message: 'Credential retrieved successfully.',credentialName:credentialNameResult.credentialName, credential: findKeyResult.credential };
        }
    } while (!keyTypeResult.status);

    return { status: false, message: 'Failed to retrieve credential.' };
}
