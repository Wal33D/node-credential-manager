import ReadlineManager from "../utils/ReadlineManager";
import { secrets } from "../src/database/secrets"; // Adjust the path as necessary

const performSecretAction = async (dbClient:any, action:any, mainMenuCallback:any) => {
    let secretName = '', newSecretName = '';
    const projectName = await ReadlineManager.askQuestion('Enter project name: ');
    const serviceName = await ReadlineManager.askQuestion('Enter service name: ');
    if (action === 'rename') {
        secretName = await ReadlineManager.askQuestion('Enter current secret name: ') as string;
        newSecretName = await ReadlineManager.askQuestion('Enter new secret name: ') as string;
    } else if (['add', 'remove', 'exists', 'findByName'].includes(action)) {
        
        secretName = await ReadlineManager.askQuestion('Enter secret name: ') as any;
    }

    try {
        //@ts-ignore
        const response = await secrets[action]({ dbClient, projectName, serviceName, secretName, newSecretName });
        console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} Secret Response:`, JSON.stringify(response, null, 2));
    } catch (error:any) {
        console.error(`An error occurred during ${action}:`, error.message);
    }

    // Return to the secret management menu after action completion
    await secretManagementMenu(dbClient, mainMenuCallback);
};

export const secretManagementMenu = async (dbClient:any, mainMenuCallback:any) => {
    console.log('\nSecret Management Menu:');
    console.log('1. List Secrets');
    console.log('2. Add Secret');
    console.log('3. Rename Secret');
    console.log('4. Remove Secret');
    console.log('5. Check if Secret Exists');
    console.log('6. Get Secret');
    console.log('7. Return to Main Menu');

    const choice = await ReadlineManager.askQuestion('Enter your choice: ');

    switch(choice) {
        case '1':
            await performSecretAction(dbClient, 'list', mainMenuCallback);
            break;
        case '2':
            await performSecretAction(dbClient, 'add',mainMenuCallback);
            break;
        case '3':
            await performSecretAction(dbClient, 'rename', mainMenuCallback);
            break;
        case '4':
            await performSecretAction(dbClient, 'remove',  mainMenuCallback);
            break;
        case '5':
            await performSecretAction(dbClient, 'exists',mainMenuCallback);
            break;
        case '6':
            await performSecretAction(dbClient, 'findByName', mainMenuCallback);
            break;
        case '7':
            await mainMenuCallback(dbClient);
            break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await secretManagementMenu(dbClient, mainMenuCallback);
    }
};
