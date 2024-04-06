import ReadlineManager from "../utils/ReadlineManager";
import { projects } from "../src/database/projects";

const listProjects = async (dbClient: any) => {
    const response = await projects.list({ dbClient });
    console.log('Projects List:', JSON.stringify(response, null, 2));
    projectManagementMenu(dbClient);
};

const createProject = async (dbClient: any) => {
    const projectName = await ReadlineManager.askQuestion('Enter project name: ') as string;
    const serviceName = await ReadlineManager.askQuestion('Enter the first service\'s name: ') as string;
    const response = await projects.create({
        dbClient,
        projectName,
        serviceName
    });
    console.log('Create Project Response:', JSON.stringify(response, null, 2));
    projectManagementMenu(dbClient);
};

const deleteProject = async (dbClient: any) => {
    const projectName = await ReadlineManager.askQuestion('Enter project name to delete: ') as string;
    const response = await projects.delete({
        dbClient,
        projectName
    });
    console.log('Delete Project Response:', JSON.stringify(response, null, 2));
    projectManagementMenu(dbClient);
};

const copyProject = async (dbClient: any) => {
    const sourceProjectName = await ReadlineManager.askQuestion('Enter source project name: ') as string;
    const targetProjectName = await ReadlineManager.askQuestion('Enter target project name: ') as string;
    const response = await projects.copy({
        dbClient,
        projectName: sourceProjectName,
        targetProjectName
    });
    console.log('Copy Project Response:', JSON.stringify(response, null, 2));
    projectManagementMenu(dbClient);
};

const checkProjectExists = async (dbClient: any) => {
    const projectName = await ReadlineManager.askQuestion('Enter project name to check: ') as string;
    const response = await projects.exists({
        dbClient,
        projectName
    });
    console.log('Check Project Exists Response:', JSON.stringify(response, null, 2));
    projectManagementMenu(dbClient);
};

export const projectManagementMenu = async (dbClient: any) => {
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
            await listProjects(dbClient);
            break;
        case '2':
            await createProject(dbClient);
            break;
        case '3':
            await deleteProject(dbClient);
            break;
        case '4':
            await copyProject(dbClient);
            break;
        case '5':
            await checkProjectExists(dbClient);
            break;
        case '6':
            await mainMenuCallback(dbClient); // Call the passed mainMenu function
            break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await projectManagementMenu(dbClient, mainMenuCallback);
    }
};

