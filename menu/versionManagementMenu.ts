// Import necessary utilities and version operations
import ReadlineManager from "../utils/ReadlineManager";
import { versions } from "../src/database/versions";

const performVersionAction = async (dbClient: any, projectName: string, serviceName: string, secretName: string, action: string, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    let versionName = '', value = '';

    switch (action) {
        case 'add':
        case 'update':
            versionName = await ReadlineManager.askQuestion('Enter version name: ');
            value = await ReadlineManager.askQuestion('Enter version value: ');
            break;
        case 'delete':
            versionName = await ReadlineManager.askQuestion('Enter version name to delete: ');
            break;
        case 'rollback':
            break;
        default:
            break;
    }

    try {
        const params = { dbClient, projectName, serviceName, secretName, versionName, value };

        const response = await versions[action](params);
        console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} Version Response:`, JSON.stringify(response, null, 2));
    } catch (error: any) {
        console.error(`An error occurred during ${action}:`, error.message);
    }

    await versionManagementMenu(dbClient, projectName, serviceName, secretName, mainMenuCallback);
};

export const versionManagementMenu = async (dbClient: any, projectName: string, serviceName: string, secretName: string, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    console.log('\nVersion Management Menu:');
    console.log('1. List Versions');
    console.log('2. Add Version');
    console.log('3. Update Version');
    console.log('4. Delete Version');
    console.log('5. Rollback Version');
    console.log('6. Return to Main Menu');

    const choice = await ReadlineManager.askQuestion('Enter your choice: ');

    switch (choice) {
        case '1':
            await performVersionAction(dbClient, projectName, serviceName, secretName, 'list', mainMenuCallback);
            break;
        case '2':
            await performVersionAction(dbClient, projectName, serviceName, secretName, 'add', mainMenuCallback);
            break;
        case '3':
            await performVersionAction(dbClient, projectName, serviceName, secretName, 'update', mainMenuCallback);
            break;
        case '4':
            await performVersionAction(dbClient, projectName, serviceName, secretName, 'delete', mainMenuCallback);
            break;
        case '5':
            await performVersionAction(dbClient, projectName, serviceName, secretName, 'rollback', mainMenuCallback);
            break;
        case '6':
            await mainMenuCallback(dbClient);
            break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await versionManagementMenu(dbClient, projectName, serviceName, secretName, mainMenuCallback);
    }
};
