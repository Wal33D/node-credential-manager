import ReadlineManager from "../utils/ReadlineManager";
import { versions } from "../src/database/versions";

let projectName = '';
let serviceName = '';
let secretName = '';
let decryptedGlobal: boolean | null = null;

const performVersionAction = async (dbClient: any, action: string, mainMenuCallback: (dbClient: any) => Promise<void>, versionName: string = '', value: string = '') => {
    try {
        const params = { dbClient, projectName, serviceName, secretName, versionName, value, decrypted: decryptedGlobal ?? false };
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

export const initializeGlobals = async () => {
    projectName = (await ReadlineManager.askQuestion('Enter project name: ') as string).trim();
    serviceName = (await ReadlineManager.askQuestion('Enter service name: ') as string).trim();
    secretName = (await ReadlineManager.askQuestion('Enter secret name: ') as string).trim();
    let decryptChoice;
    do {
        decryptChoice = (await ReadlineManager.askQuestion('Do you want the versions decrypted? (yes/no): ') as string).trim().toLowerCase();
        if (decryptChoice !== 'yes' && decryptChoice !== 'no') {
            console.log('Invalid input. Please answer "yes" or "no".');
        }
    } while (decryptChoice !== 'yes' && decryptChoice !== 'no');
    decryptedGlobal = decryptChoice === 'yes';
};

export const versionManagementMenu = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    // Call initializeGlobals at the start if globals are not yet set
    if (!projectName || !serviceName || !secretName || decryptedGlobal === null) {
        await initializeGlobals();
    }
    console.log('\nVersion Management Menu:');
    console.log('1. List Versions');
    console.log('2. Add Version');
    console.log('3. Update Version');
    console.log('4. Delete Version');
    console.log('5. Rollback Version');
    console.log('6. Get Latest Version');
    console.log('7. Change Global Settings');
    console.log('8. Return to Main Menu');

    const choice = (await ReadlineManager.askQuestion('Enter your choice: ') as string).trim()
    if (choice === '8') {
        await mainMenuCallback(dbClient);
        return;
    } else if (choice === '7') {
        await initializeGlobals();
        await versionManagementMenu(dbClient, mainMenuCallback);
        return;
    }

    await handleVersionAction(choice, dbClient, mainMenuCallback);
};

const handleVersionAction = async (choice: string, dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    const action = choiceToAction(choice);
    let versionName = '', value = '';
    switch (action) {
        case 'add':
        case 'update':
   versionName = (await ReadlineManager.askQuestion(
            'Enter version number (e.g., v1.0). It will be auto-incremented if not supplied: '
        ) as string).trim();
        value = (await ReadlineManager.askQuestion(
            'Enter version value (Note: This will be encrypted automatically using AES-256-CTR algorithm for database storage): '
        ) as string).trim();
        break;
    case 'delete':
        versionName = (await ReadlineManager.askQuestion(
            'Enter version number to delete (e.g., v1.0): '
        ) as string).trim();
        break;
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
