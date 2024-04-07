import ReadlineManager from "../utils/ReadlineManager";
import { projects } from "../src/database/projects";

// Function to perform specific project-related actions based on user input
const performProjectAction = async (dbClient: any, action: string, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    let projectName = '', targetProjectName = '', serviceName = '';

    // Handle specific actions that require additional information
    switch (action) {
        case 'create':
            projectName = await ReadlineManager.askQuestion('Enter project name: ') as string;
            serviceName = await ReadlineManager.askQuestion('Enter the first service\'s name: ') as string;
            break;
        case 'delete':
        case 'exists':
            projectName = await ReadlineManager.askQuestion('Enter project name: ') as string;
            break;
        case 'copy':
            projectName = await ReadlineManager.askQuestion('Enter source project name: ') as string;
            targetProjectName = await ReadlineManager.askQuestion('Enter target project name: ') as string;
            break;
        default:
            break;
    }

    try {
        // Execute the requested action with the provided parameters
        let response;
        if (action === 'create') {
            response = await projects.create({ dbClient, projectName, serviceName });
        } else if (action === 'copy') {
            response = await projects.copy({ dbClient, projectName, targetProjectName });
        } else {
            //@ts-ignore
            response = await projects[action]({ dbClient, projectName });
        }
        console.log(`${action.charAt(0).toUpperCase() + action.slice(1)} Project Response:`, JSON.stringify(response, null, 2));
    } catch (error: any) {
        console.error(`An error occurred during ${action}:`, error.message);
    }

    // Return to the main menu after performing the action
    await projectManagementMenu(dbClient, mainMenuCallback);
};

// Main menu for project management, allowing the user to select an action to perform
export const projectManagementMenu = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    console.log('\nProject Management Menu:');
    console.log('1. List Projects');
    console.log('2. Create Project');
    console.log('3. Delete Project');
    console.log('4. Copy Project');
    console.log('5. Check if Project Exists');
    console.log('6. Return to Main Menu');

    const choice = await ReadlineManager.askQuestion('Enter your choice: ');

    switch (choice) {
        case '1':
            await performProjectAction(dbClient, 'list', mainMenuCallback);
            break;
        case '2':
            await performProjectAction(dbClient, 'create', mainMenuCallback);
            break;
        case '3':
            await performProjectAction(dbClient, 'delete', mainMenuCallback);
            break;
        case '4':
            await performProjectAction(dbClient, 'copy', mainMenuCallback);
            break;
        case '5':
            await performProjectAction(dbClient, 'exists', mainMenuCallback);
            break;
        case '6':
            await mainMenuCallback(dbClient);
            break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await projectManagementMenu(dbClient, mainMenuCallback);
    }
};
