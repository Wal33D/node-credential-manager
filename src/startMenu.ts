import { MongoClient } from "mongodb";
import readline from "readline";
import { databaseManager } from "./DatabaseManager";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { checkAndGenerateEncryptionKey } from "./encryptionInit";
import { projects } from "./database/projects";
// Initialize readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Main function to start the application
const startApplication = async () => {
    console.log("Initializing database connection...");

    const connectionResult = await initializeDbConnection({}); // Adjust as needed to pass config
    if (!connectionResult.status) {
        console.error("Failed to initialize database connection:", connectionResult.message);
        process.exit(1); // Exit if connection fails
    }

    const dbClient = connectionResult.client;


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
                    console.log('Exiting Project Management...');
                    rl.close();
                    dbClient.close(); // Close the MongoClient connection
                    break;
                default:
                    console.log('Invalid choice. Please select a valid option.');
                    mainMenu();
            }
        });

    };

    const listProjects = async (dbClient:any) => {
        // Assuming databaseManager is available in this scope
        const response = await projects.list({dbClient});
        console.log('Projects List:', JSON.stringify(response, null, 2));
        mainMenu();
    };

    const createProject = async (dbClient:any) => {
        rl.question('Enter project name: ', async (projectName) => {
            const response = await projects.create({ 
                dbClient,
                projectName,
                serviceName: 'TestService'
            });
            console.log('Create Project Response:', response);
            mainMenu();
        });
    };

    const deleteProject = async (dbClient:any) => {
        rl.question('Enter project name to delete: ', async (projectName) => {
            const response = await projects.delete({
                dbClient,
                projectName
            });
            console.log('Delete Project Response:', JSON.stringify(response, null, 2));
            mainMenu();
        });
    };

    const copyProject = async (dbClient:any) => {
        rl.question('Enter source project name: ', (sourceProjectName) => {
            rl.question('Enter target project name: ', async (targetProjectName) => {
                const response = await projects.copy({
                    dbClient,
                    projectName: sourceProjectName,
                    targetProjectName
                });
                console.log('Copy Project Response:', JSON.stringify(response, null, 2));
                mainMenu();
            });
        });
    };

    const checkProjectExists = async (dbClient:any) => {
        rl.question('Enter project name to check: ', async (projectName) => {
            const response = await projects.exists({
                dbClient,
                projectName
            });
            console.log('Check Project Exists Response:', JSON.stringify(response, null, 2));
            mainMenu();
        });
    };

    mainMenu(); // Start the main menu

};

// Invoke the startApplication function to run the app
startApplication();
