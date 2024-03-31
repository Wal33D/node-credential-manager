import { promptForNewCollectionName } from './promptForNewCollectionName';

export async function promptForCollectionDeletion({ credentialManager, readLineInterface }: { credentialManager: any; readLineInterface: any }): Promise<{
    status: boolean;
    message: string;
}> {
    let status = false;
    let message = '';

    try {
        const deleteCollectionPrompt = async (): Promise<{
            status: boolean;
            message: string;
        }> => {
            const promptResult = await promptForNewCollectionName({ credentialManager, readLineInterface });
            if (!promptResult.status) {
                return { status: false, message: "Deletion canceled or invalid collection name provided." };
            }

            const deleteResult = await credentialManager.deleteCredentialsCollection(promptResult.newName);
            if (!deleteResult.status) {
                console.log(deleteResult.message);
                return await deleteCollectionPrompt();
            }

            await credentialManager.resetCollectionNameToDefault(); 
            return { status: true, message: deleteResult.message };
        };

        const result = await deleteCollectionPrompt();
        status = result.status;
        message = result.message;
    } catch (error: any) {
        status = false;
        message = `An error occurred during the deletion process: ${error.message}`;
    }

    return { status, message };
}
