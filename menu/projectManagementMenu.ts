import ReadlineManager from "../utils/ReadlineManager";
import { projects } from "../src/database/projects";

// Generic function to handle repetitive project operations
const handleProjectOperation = async (operation:any, dbClient:any, mainMenuCallback:any, ...questions:any) => {
    const answers = await Promise.all(questions.map((question: any) => ReadlineManager.askQuestion(question)));
    const response = await operation({ dbClient, ...answers });
    console.log(`${operation.name} Response:`, JSON.stringify(response, null, 2));
    projectManagementMenu(dbClient, mainMenuCallback);
};

export const projectManagementMenu = async (dbClient:any, mainMenuCallback:any) => {
    console.log('\nProject Management Menu:');
    const menuOptions = {
        '1': () => handleProjectOperation(projects.list, dbClient, mainMenuCallback),
        '2': () => handleProjectOperation(projects.create, dbClient, mainMenuCallback, 'Enter project name: ', 'Enter the first service\'s name: '),
        '3': () => handleProjectOperation(projects.delete, dbClient, mainMenuCallback, 'Enter project name to delete: '),
        '4': () => handleProjectOperation(projects.copy, dbClient, mainMenuCallback, 'Enter source project name: ', 'Enter target project name: '),
        '5': () => handleProjectOperation(projects.exists, dbClient, mainMenuCallback, 'Enter project name to check: '),
        '6': () => mainMenuCallback(dbClient)
    };

    console.log('1. List Projects\n2. Create Project\n3. Delete Project\n4. Copy Project\n5. Check if Project Exists\n6. Return to Main Menu');
    const choice = await ReadlineManager.askQuestion('Enter your choice: ');

    const action = menuOptions[choice] as;
    if (action) {
        await action();
    } else {
        console.log('Invalid choice. Please select a valid option.');
        await projectManagementMenu(dbClient, mainMenuCallback);
    }
};
