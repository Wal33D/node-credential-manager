import readline from "readline";
import { runAllTests } from "./tests/runAllTests";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { checkAndGenerateEncryptionKey } from "./utils/encryptionInit";
import { projects } from "./database/projects";
import { projectManagementMenu } from "./projectManagement";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const askQuestion = (query:any) => {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
};

const startApplication = async () => {
    console.log("Initializing database connection...");

    const connectionResult = await initializeDbConnection({}); 
    if (!connectionResult.status) {
        console.error("Failed to initialize database connection:", connectionResult.message);
        process.exit(1);
    }

    const dbClient = connectionResult.client;
    await mainMenu(dbClient);
};

const listProjects = async (dbClient: any) => {
    const response = await projects.list({ dbClient });
    console.log('Projects List:', JSON.stringify(response, null, 2));
    mainMenu(dbClient);
};

const createProject = async (dbClient: any) => {
    const projectName = await askQuestion('Enter project name: ') as string;
    const serviceName = await askQuestion('Enter the first service\'s name: ') as string;
    const response = await projects.create({
        dbClient,
        projectName,
        serviceName
    });
    console.log('Create Project Response:', JSON.stringify(response, null, 2));
    mainMenu(dbClient);
};


const deleteProject = async (dbClient: any) => {
    const projectName = await askQuestion('Enter project name to delete: ') as string;
    const response = await projects.delete({
        dbClient,
        projectName
    });
    console.log('Delete Project Response:', JSON.stringify(response, null, 2));
    mainMenu(dbClient);
};

const copyProject = async (dbClient: any) => {
    const sourceProjectName = await askQuestion('Enter source project name: ') as string;
    const targetProjectName = await askQuestion('Enter target project name: ') as string;
    const response = await projects.copy({
        dbClient,
        projectName: sourceProjectName,
        targetProjectName
    });
    console.log('Copy Project Response:', JSON.stringify(response, null, 2));
    mainMenu(dbClient);
};

const checkProjectExists = async (dbClient: any) => {
    const projectName = await askQuestion('Enter project name to check: ') as any;
    const response = await projects.exists({
        dbClient,
        projectName
    });
    console.log('Check Project Exists Response:', JSON.stringify(response, null, 2));
    mainMenu(dbClient);
};

const mainMenu = async (dbClient: any) => {
    console.log('\nMain Menu:');
    console.log('1. Project Management');
    console.log('2. Run All Tests');
    console.log('3. Check and Generate Encryption Key');
    console.log('3. Other functionality here...');
    console.log('4. Exit');

    const choice = await askQuestion('Enter your choice: ');

    switch (choice) {
        case '1':
            await projectManagementMenu(dbClient);
            break;
        case '2':
            console.log('Running all tests...');
            await runAllTests();
            console.log('Tests completed.');
            await mainMenu(dbClient);
            break;
        case '3':
            console.log('Checking and generating encryption key...');
            await checkAndGenerateEncryptionKey();
            console.log('Operation completed.');
            await mainMenu(dbClient);
            break;
        case '4':
            console.log('Exiting application...');
            rl.close();
            if (dbClient && dbClient.close) {
                dbClient.close();
            }
            break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await mainMenu(dbClient);
    }
};

const projectManagementMenu = async (dbClient: any) => {
    console.log('\nProject Management Menu:');
    console.log('1. List Projects');
    console.log('2. Create Project');
    console.log('3. Delete Project');
    console.log('4. Copy Project');
    console.log('5. Check if Project Exists');
    console.log('6. Return to Main Menu');

    const choice = await askQuestion('Enter your choice: ');

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
            await mainMenu(dbClient);
            break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await projectManagementMenu(dbClient); 
    }

    mainMenu(dbClient);

};

startApplication();

