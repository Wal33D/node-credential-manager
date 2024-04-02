import { promptForNewCollectionName } from './promptForNewCollectionName';

export async function promptForCollectionNameChange({ credentialManager, readLineInterface }: { credentialManager: any; readLineInterface: any }): Promise<{
    status: boolean;
    message: string;
}> {
    let status = false;
    let message = '';

    try {
        // Prompt for the new collection name
        const newNameResult = await promptForNewCollectionName({ credentialManager, readLineInterface });
        if (!newNameResult.status || !newNameResult.newName) {
            throw new Error("Operation canceled or invalid collection name provided.");
        }

        return await credentialManager.createCabinet(newNameResult.newName);

    } catch (error: any) {
        message = `An error occurred during the collection name change process: ${error.message}`;
    }

    return { status, message };
}
