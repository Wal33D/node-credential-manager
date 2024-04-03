export const findCredentialByName = async ({ credentialName, credentialManager }: { credentialName: string, credentialManager: any }): Promise<{ status: boolean; credentialName: string; credentials: any[]; message: string; }> => {
    let status = false;
    let credentials = [];
    let message = '';

    try {
        if (!credentialManager.dbConnection) {
            throw new Error('Database connection is not initialized.');
        }
        const collectionName = credentialManager.collectionName;
        const dbCollection = credentialManager.dbConnection.collection(collectionName);
        const credentialDocument = await dbCollection.findOne({ name: credentialName });

        if (!credentialDocument) {
            const caseInsensitiveCredential = await dbCollection.findOne({
                name: { $regex: new RegExp("^" + credentialName + "$", "i") }
            });

            if (caseInsensitiveCredential) {
                message = `Credential '${credentialName}' not found.\n - Hint: Did you mean '${caseInsensitiveCredential.name}'? Credential name is case-sensitive.\n`;
            } else {
                message = `Credential '${credentialName}' not found.`;
            }
        } else {
            status = true;
            credentials = credentialDocument.credentials;
            credentialName = credentialDocument.name;
            message = `Credentials for credential '${credentialDocument.name}' retrieved successfully.`;
        }
    } catch (error: any) {
        message = `Error: ${error.message}`;
    }

    return { status, credentialName, credentials, message };
};
