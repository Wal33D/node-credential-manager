import ReadlineManager from "../utils/ReadlineManager";
import { versions } from "../src/database/versions";

let projectName = '';
let serviceName = '';
let secretName = '';
let decryptedGlobal = false; 

const performVersionAction = async (dbClient: any, action: string, mainMenuCallback: (dbClient: any) => Promise<void>, versionName: string = '', value: string = '') => {
    try {
        // Use the global decrypted choice for all actions
        const params = { dbClient, projectName, serviceName, secretName, versionName, value, decrypted: decryptedGlobal };
        //@ts-ignore
        const response = await versions[action](params);
        console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} Version Response:`, JSON.stringify(response, null, 2));
    } catch (error: any) {
        console.error(`An error occurred during ${action}:`, error.message);
    }

    if (action !== 'return') {
        await versionManagementMenu(dbClient, mainMenuCallback);
    }
};

export const versionManagementMenu = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    console.log('\nVersion Management Menu:');

    if (!projectName) {
        projectName = (await ReadlineManager.askQuestion('Enter project name: ') as string ).trim();
    }
    if (!serviceName) {
        serviceName = (await ReadlineManager.askQuestion('Enter service name: ') as string ).trim();
    }
    if (!secretName) {
        secretName = (await ReadlineManager.askQuestion('Enter secret name: ') as string ).trim();
    }
    if (!decryptedGlobal) { // Ask for decryption preference if not set
        const decryptChoice = (await ReadlineManager.askQuestion('Do you want the versions decrypted? (yes/no): ') as string ).trim();
        decryptedGlobal = decryptChoice.trim().toLowerCase() === 'yes';
    }

    console.log('1. List Versions');
    console.log('2. Add Version');
    console.log('3. Update Version');
    console.log('4. Delete Version');
    console.log('5. Rollback Version');
    console.log('6. Get Latest Version');
    console.log('7. Return to Main Menu');

    const choice = (await ReadlineManager.askQuestion('Enter your choice: ') as string ).trim();
    if (choice === '7') {
        await mainMenuCallback(dbClient);
        return;
    }

    const action = choiceToAction(choice);
    let versionName = '', value = '';
    switch (action) {
        case 'add':
        case 'update':
            versionName = (await ReadlineManager.askQuestion('Enter version name: ') as string ).trim();
            value = (await ReadlineManager.askQuestion('Enter version value: ') as string ).trim();
            break;
        case 'delete':
            versionName = (await ReadlineManager.askQuestion('Enter version number to delete: ') as string ).trim();
            break;
        // No need for cases 'list', 'rollback', 'latest' as decryptedGlobal is used directly
    }

    await performVersionAction(dbClient, action, mainMenuCallback, versionName, value);
};

const choiceToAction = (choice: string) => {
    switch (choice) {
        case '1': return 'list';
        case '2': return 'add';
        case '3': return 'update';
        case '4': return 'delete';
        case '5': return 'rollback';
        case '6': return 'latest'; 
        default: throw new Error('Invalid choice for action mapping');
    }
};
