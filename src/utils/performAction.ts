import { CredentialManager } from "../CredentialManager";


export const performAction = async ({ action, readLineInterface, credentialManager, }: { action: string, readLineInterface?: any, credentialManager: CredentialManager, }): Promise<{ status: boolean, message: string, continueApp: boolean }> => {
    let status = false;
    let message = '';
    let continueApp = true;

    try {
        const credentialManager = new CredentialManager();
  await credentialManager.initializeAllOffices();

    } catch (error: any) {
        message = `An error occurred: ${error.message}`;
    } finally {
        readLineInterface.close();
    }

    return { status, message, continueApp };
};
