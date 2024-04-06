// Import necessary modules and functions
import { runAllTests } from "./tests/runAllTests";
import { MongoClient } from "mongodb";
import { createDatabaseManager } from "./DatabaseManager";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { checkAndGenerateEncryptionKey } from "./encryptionInit";
import readline from "readline";
const databaseManager = await createDatabaseManager(dbClient);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const mainMenu = async () => {
    console.log('\nProject Management Menu:');
    console.log('1. List Projects');
    console.log('2. Create Project');
    console.log('3. Delete Project');
    console.log('4. Copy Project');
    console.log('5. Check if Project Exists');
    console.log('6. Exit');

    rl.question('Enter your choice: ', async (choice) => {
        switch (choice) {
            case '1':
                await listProjects();
                break;
            case '2':
                await createProject();
                break;
            case '3':
                await deleteProject();
                break;
            case '4':
                await copyProject();
                break;
            case '5':
                await checkProjectExists();
                break;
            case '6':
                console.log('Exiting Project Management...');
                rl.close();
                return;
            default:
                console.log('Invalid choice. Please select a valid option.');
                mainMenu();
        }
    });
};

const listProjects = async () => {
    // Assuming databaseManager is available in this scope
    const response = await databaseManager.projects.list({});
    console.log('Projects List:', JSON.stringify(response, null, 2));
    mainMenu();
};

const createProject = async () => {
    rl.question('Enter project name: ', async (projectName) => {
        const response = await databaseManager.projects.create({
            projectName
            // Other necessary params here
        });
        console.log('Create Project Response:', JSON.stringify(response, null, 2));
        mainMenu();
    });
};

const deleteProject = async () => {
    rl.question('Enter project name to delete: ', async (projectName) => {
        const response = await databaseManager.projects.delete({
            projectName
            // Other necessary params here
        });
        console.log('Delete Project Response:', JSON.stringify(response, null, 2));
        mainMenu();
    });
};

const copyProject = async () => {
    rl.question('Enter source project name: ', (sourceProjectName) => {
        rl.question('Enter target project name: ', async (targetProjectName) => {
            const response = await databaseManager.projects.copy({
                projectName: sourceProjectName,
                targetProjectName
                // Other necessary params here
            });
            console.log('Copy Project Response:', JSON.stringify(response, null, 2));
            mainMenu();
        });
    });
};

const checkProjectExists = async () => {
    rl.question('Enter project name to check: ', async (projectName) => {
        const response = await databaseManager.projects.exists({
            projectName
            // Other necessary params here
        });
        console.log('Check Project Exists Response:', JSON.stringify(response, null, 2));
        mainMenu();
    });
};

mainMenu();
