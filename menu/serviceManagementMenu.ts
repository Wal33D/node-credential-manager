import ReadlineManager from "../utils/ReadlineManager";
import { services } from "../src/database/services";

const listServices = async (dbClient: any, projectName: string, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    const response = await services.list({ dbClient, projectName });
    console.log('Services List:', JSON.stringify(response, null, 2));
    serviceManagementMenu(dbClient, mainMenuCallback);
};
const performServiceAction = async (dbClient: any, projectName: string, action: string, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    let serviceName = '', newServiceName = '';
    if (action !== 'list') {
        serviceName = await ReadlineManager.askQuestion('Enter service name: ') as string;
        if (action === 'rename') {
            newServiceName = await ReadlineManager.askQuestion('Enter new service name: ') as string;
        }
    }

    try {
        let response;
        switch (action) {
            case 'add':
                response = await services.add({ dbClient, projectName, serviceName });
                break;
            case 'rename':
                response = await services.rename({ dbClient, projectName, serviceName, newServiceName });
                break;
            case 'remove':
                response = await services.remove({ dbClient, projectName, serviceName });
                break;
            case 'exists':
                response = await services.exists({ dbClient, projectName, serviceName });
                break;
            case 'getService':
                response = await services.getService({ dbClient, projectName, serviceName });
                break;
            default:
                throw new Error('Unsupported action');
        }
        console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} Service Response:`, JSON.stringify(response, null, 2));
    } catch (error:any) {
        console.error(`An error occurred during ${action}:`, error.message);
    }
    serviceManagementMenu(dbClient, mainMenuCallback);
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
    let projectName='';
    switch (choice) {
        case '1':
            projectName = await ReadlineManager.askQuestion('Enter the project name for service management: ') as string;
            await listServices(dbClient, projectName, mainMenuCallback);
            break;
        case '2':
            await performServiceAction(dbClient, projectName, 'add', mainMenuCallback);
            break;
        case '3':
            await performServiceAction(dbClient, projectName, 'rename', mainMenuCallback);
            break;
        case '4':
            await performServiceAction(dbClient, projectName, 'remove', mainMenuCallback);
            break;
        case '5':
            await performServiceAction(dbClient, projectName, 'exists', mainMenuCallback);
            break;
        case '6':
            await performServiceAction(dbClient, projectName, 'getService', mainMenuCallback);
            break;
        case '7':
            await mainMenuCallback(dbClient);
            break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await serviceManagementMenu(dbClient, mainMenuCallback);
    }
};