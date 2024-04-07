import ReadlineManager from "../utils/ReadlineManager";
import { versions } from "../src/database/versions";

let projectName = '';
let serviceName = '';
let secretName = '';

const performVersionAction = async (dbClient: any, action: string, mainMenuCallback: (dbClient: any) => Promise<void>, versionName: string = '', value: string = '', decrypted: boolean = false) => {
    try {
        // Note that we're now using `secretName` directly from the outer scope.
        const params = { dbClient, projectName, serviceName, secretName, versionName, value, decrypted };
        //@ts-ignore
        const response = await versions[action](params);
        console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} Version Response:`, JSON.stringify(response, null, 2));
    } catch (error: any) {
        console.error(`An error occurred during ${action}:`, error.message);
    }

    // Only call the versionManagementMenu if the action is not 'return to main menu'
    if (action !== 'return') {
        await versionManagementMenu(dbClient, mainMenuCallback);
    }
};

export const versionManagementMenu = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    console.log('\nVersion Management Menu:');

    // Validate and initialize projectName if not already set
    while (!projectName || !projectName.trim().length) {
        projectName = await ReadlineManager.askQuestion('Enter project name: ') as string;
        if (!projectName.trim().length) {
            console.log('Project name must be a non-empty string. Please try again.');
        } else {
            projectName = projectName.trim();
        }
    }

    // Validate and initialize serviceName if not already set
    while (!serviceName || !serviceName.trim().length) {
        serviceName = await ReadlineManager.askQuestion('Enter service name: ') as string;
        if (!serviceName.trim().length) {
            console.log('Service name must be a non-empty string. Please try again.');
        } else {
            serviceName = serviceName.trim();
        }
    }

    // Validate and initialize secretName if not already set
    while (!secretName || !secretName.trim().length) {
        secretName = await ReadlineManager.askQuestion('Enter secret name: ') as string;
        if (!secretName.trim().length) {
            console.log('Secret name must be a non-empty string. Please try again.');
        } else {
            secretName = secretName.trim();
        }
    }

    // Menu options
    console.log('1. List Versions');
    console.log('2. Add Version');
    console.log('3. Update Version');
    console.log('4. Delete Version');
    console.log('5. Rollback Version');
    console.log('6. Get Latest Version');
    console.log('7. Return to Main Menu');

    const choice = await ReadlineManager.askQuestion('Enter your choice: ') as string;
    
    // Handle return to main menu without additional prompts
    if (choice === '7') {
        await mainMenuCallback(dbClient);
        return; // Exit function to prevent further execution
    }

    const action = choiceToAction(choice);

    let versionName = '', value = '';
    let decrypted = false;
    let decryptResult = '';

    switch (action) {
        case 'list':
        case 'rollback':
        case 'latest':
            decryptResult = await ReadlineManager.askQuestion('Do you want the versions decrypted? (yes/no): ') as string;
            decrypted = decryptResult.trim().toLowerCase() === 'yes';
            break;
        case 'add':
        case 'update':
            versionName = await ReadlineManager.askQuestion('Enter version name: ') as string;
            value = await ReadlineManager.askQuestion('Enter version value: ') as string;
            break;
        case 'delete':
            versionName = await ReadlineManager.askQuestion('Enter version number to delete: ') as string;
            break;
    }

    await performVersionAction(dbClient, action, mainMenuCallback, versionName, value, decrypted);
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
