import ReadlineManager from "../utils/ReadlineManager";
import { services } from "../src/database/services";

const listServices = async (dbClient: any, projectName: string, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    const response = await services.list({ dbClient, projectName });
    console.log('Services List:', JSON.stringify(response, null, 2));
    serviceManagementMenu(dbClient, projectName, mainMenuCallback);
};


export const serviceManagementMenu = async (dbClient: any, projectName: string, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    console.log('\nService Management Menu:');
    console.log('1. List Services');
    console.log('2. Add Service');
    console.log('3. Rename Service');
    console.log('4. Remove Service');
    console.log('5. Check if Service Exists');
    console.log('6. Get Service');
    console.log('7. Return to Main Menu');

    const choice = await ReadlineManager.askQuestion('Enter your choice: ');

    switch (choice) {
        case '1':
            await listServices(dbClient, projectName, mainMenuCallback);
            break;
        case '7':
            await mainMenuCallback(dbClient);
            break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await serviceManagementMenu(dbClient, projectName, mainMenuCallback);
    }
};
