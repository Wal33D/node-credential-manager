import { promptForNewCollectionName } from './promptForNewCollectionName';

export async function promptForCollectionNameChange({ credentialManager, readLineInterface }: { credentialManager: any; readLineInterface: any }): Promise<{
    status: boolean;
    message: string;
}> {
    let status = false;
    let message = '';

    try {
        const newNameResult = await promptForNewCollectionName({ credentialManager, readLineInterface });
        if (!newNameResult.status || !newNameResult.newName) {
            return { status: false, message: "Operation canceled or invalid collection name provided." };
        }

        const newName = newNameResult.newName;
        const setCollectionResult = await credentialManager.setCollectionName(newName);
        if (!setCollectionResult.status) {
            console.log(setCollectionResult.message);
            return { status: false, message: setCollectionResult.message };
        }

        const createCollectionResult = await credentialManager.createCredentialsCollection(newName);
        if (createCollectionResult.status) {
            message = `Collection name changed successfully.`;
            if (createCollectionResult.existed) {
                message += ` The collection '${newName}' already existed.`;
                status = false;
            } else {
                message += ` A new collection '${newName}' was created successfully.`;
                status = true;

            }
        } else {
            message = `Failed to create or confirm the existence of the collection '${newName}'.`;
            status = false;
        }
    } catch (error: any) {
        status = false;
        message = `An error occurred during the collection name change process: ${error.message}`;
    }

    return { status, message };
}
