import ReadlineManager from "../utils/ReadlineManager";
import { projects } from "../src/database/projects";

const listProjects = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    const response = await projects.list({ dbClient });
    console.log('Projects List:', JSON.stringify(response, null, 2));
    projectManagementMenu(dbClient, mainMenuCallback);
};

const createProject = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    const projectName = await ReadlineManager.askQuestion('Enter project name: ');
    const serviceName = await ReadlineManager.askQuestion('Enter the first service\'s name: ');
    const response = await projects.create({
        dbClient,
        projectName,
        serviceName
    } as any);
    console.log('Create Project Response:', JSON.stringify(response, null, 2));
    projectManagementMenu(dbClient, mainMenuCallback);
};

const deleteProject = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    const projectName = await ReadlineManager.askQuestion('Enter project name to delete: ');
    const response = await projects.delete({
        dbClient,
        projectName
    } as any);
    console.log('Delete Project Response:', JSON.stringify(response, null, 2));
    projectManagementMenu(dbClient, mainMenuCallback);
};

const copyProject = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    const sourceProjectName = await ReadlineManager.askQuestion('Enter source project name: ');
    const targetProjectName = await ReadlineManager.askQuestion('Enter target project name: ');
    const response = await projects.copy({
        dbClient,
        projectName: sourceProjectName,
        targetProjectName
    } as any);
    console.log('Copy Project Response:', JSON.stringify(response, null, 2));
    projectManagementMenu(dbClient, mainMenuCallback);
};

const checkProjectExists = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    const projectName = await ReadlineManager.askQuestion('Enter project name to check: ');
    const response = await projects.exists({
        dbClient,
        projectName
    } as any);
    console.log('Check Project Exists Response:', JSON.stringify(response, null, 2));
    projectManagementMenu(dbClient, mainMenuCallback);
};

export const projectManagementMenu = async (dbClient: any, mainMenuCallback: (dbClient: any) => Promise<void>) => {
    // Menu options remain the same
    console.log('\nProject Management Menu:');
    console.log('1. List Projects');
    console.log('2. Create Project');
    console.log('3. Delete Project');
    console.log('4. Copy Project');
    console.log('5. Check if Project Exists');
    console.log('6. Return to Main Menu');
    const choice = await ReadlineManager.askQuestion('Enter your choice: ');

    switch (choice) {
        case '1': await listProjects(dbClient, mainMenuCallback); break;
        case '2': await createProject(dbClient, mainMenuCallback); break;
        case '3': await deleteProject(dbClient, mainMenuCallback); break;
        case '4': await copyProject(dbClient, mainMenuCallback); break;
        case '5': await checkProjectExists(dbClient, mainMenuCallback); break;
        case '6': await mainMenuCallback(dbClient); break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await projectManagementMenu(dbClient, mainMenuCallback);
    }
};
