import ReadlineManager from "../utils/ReadlineManager";
import { services } from "../src/database/services";

// Simplify by removing redundant projectName passing for 'list' action
const performServiceAction = async (dbClient: any, projectName: string, action: string, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    let serviceName = '', newServiceName = '';
    action = action as 'add', 'rename', 'remove', 'exists', 'getService';
    if (['add', 'rename', 'remove', 'exists', 'getService'].includes(action)) {
        serviceName = await ReadlineManager.askQuestion('Enter service name: ') as string;
        if (action === 'rename') {
            newServiceName = await ReadlineManager.askQuestion('Enter new service name: ')as string;
        }
    }

    try {
        const params = { dbClient, projectName, serviceName, newServiceName };
        //@ts-ignore
        const response = await services[action](params) ;
        console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} Service Response:`, JSON.stringify(response, null, 2));
    } catch (error:any) {
        console.error(`An error occurred during ${action}:`, error.message);
    }

    // Return back to service menu after performing action
    await serviceManagementMenu(dbClient, mainMenuCallback);
};

export const serviceManagementMenu = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    console.log('\nService Management Menu:');
    console.log('1. List Services');
    console.log('2. Add Service');
    console.log('3. Rename Service');
    console.log('4. Remove Service');
    console.log('5. Check if Service Exists');
    console.log('6. Get Service');
    console.log('7. Return to Main Menu');

    const choice = await ReadlineManager.askQuestion('Enter your choice: ');
let projectName ;
    switch (choice) {
        case '1':
            // For listing, the projectName is needed upfront
            if (!projectName) projectName = await ReadlineManager.askQuestion('Enter project name: ') as string;
            await performServiceAction(dbClient, projectName, 'list', mainMenuCallback);
            break;
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
            // For actions other than list, ensure projectName is set
            if (!projectName) projectName = await ReadlineManager.askQuestion('Enter project name for service management: ') as string;
            await performServiceAction(dbClient, projectName, choiceToAction(choice), mainMenuCallback);
            break;
        case '7':
            await mainMenuCallback(dbClient);
            break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await serviceManagementMenu(dbClient, mainMenuCallback);
    }
};

// Helper to map choice to action string
const choiceToAction = (choice:any) => {
    switch(choice) {
        case '2': return 'add';
        case '3': return 'rename';
        case '4': return 'remove';
        case '5': return 'exists';
        case '6': return 'getService';
        default: throw new Error('Invalid choice for action mapping');
    }
};
