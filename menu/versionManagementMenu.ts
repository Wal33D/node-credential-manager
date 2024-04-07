import ReadlineManager from "../utils/ReadlineManager";
import { versions } from "../src/database/versions";

const performVersionAction = async (dbClient: any, action: string, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    // Prompt for project, service, and secret names at the start of the action
    const projectName = await ReadlineManager.askQuestion('Enter project name: ')as string;
    const serviceName = await ReadlineManager.askQuestion('Enter service name: ')as string;
    const secretName = await ReadlineManager.askQuestion('Enter secret name: ')as string;

    let versionName = '', value = '';

    // Extend the switch case for 'latest' action
    switch (action) {
        case 'add':
        case 'update':
            versionName = await ReadlineManager.askQuestion('Enter version name: ')as string;
            value = await ReadlineManager.askQuestion('Enter version value: ')as string;
            break;
        case 'delete':
            versionName = await ReadlineManager.askQuestion('Enter version name to delete: ')as string;
            break;
        case 'rollback':
        case 'latest': // No additional input required for 'latest'
            break;
        default:
            console.log('Invalid action. Returning to main menu.');
            mainMenuCallback(dbClient);
            return;
    }

    try {
        // For the 'latest' action, versionName and value are not used, so they won't affect the function call
        const params = { dbClient, projectName, serviceName, secretName, versionName, value };
        const response = await versions[action](params);
        console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} Version Response:`, JSON.stringify(response, null, 2));
    } catch (error: any) {
        console.error(`An error occurred during ${action}:`, error.message);
    }

    // Return to the version management menu after the action
    await versionManagementMenu(dbClient, mainMenuCallback);
};

export const versionManagementMenu = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    console.log('\nVersion Management Menu:');
    console.log('1. List Versions');
    console.log('2. Add Version');
    console.log('3. Update Version');
    console.log('4. Delete Version');
    console.log('5. Rollback Version');
    console.log('6. Get Latest Version');
    console.log('7. Return to Main Menu');

    const choice = await ReadlineManager.askQuestion('Enter your choice: ');

    // Add a case for handling the 'latest' action
    switch (choice) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6': // Handle the 'latest' action
            const action = choiceToAction(choice);
            await performVersionAction(dbClient, action, mainMenuCallback);
            break;
        case '7':
            await mainMenuCallback(dbClient);
            break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await versionManagementMenu(dbClient, mainMenuCallback);
    }
};

// Update choiceToAction to include the 'latest' option
const choiceToAction = (choice:any) => {
    switch(choice) {
        case '1': return 'list';
        case '2': return 'add';
        case '3': return 'update';
        case '4': return 'delete';
        case '5': return 'rollback';
        case '6': return 'latest'; // Map choice '6' to 'latest' action
        default: throw new Error('Invalid choice for action mapping');
    }
};
