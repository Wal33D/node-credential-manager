import { MongoClient } from "mongodb";
import readline from "readline";
import { createDatabaseManager } from "./DatabaseManager";
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
    const databaseManager = await createDatabaseManager(dbClient); // Create the database manager with dbClient

    // Define menu functions here, ensuring they have access to `dbClient` either by closure or by passing it explicitly if needed

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
                    await listProjects(databaseManager);
                    break;
                case '2':
                    await createProject(dbClient);
                    break;
                case '3':
                    await deleteProject(databaseManager);
                    break;
                case '4':
                    await copyProject(databaseManager);
                    break;
                case '5':
                    await checkProjectExists(databaseManager);
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

    const listProjects = async (databaseManager:any) => {
        // Assuming databaseManager is available in this scope
        const response = await databaseManager.projects.list({});
        console.log('Projects List:', JSON.stringify(response, null, 2));
        mainMenu();
    };

    const createProject = async (dbClient:any) => {
        rl.question('Enter project name: ', async (projectName) => {
            const response = await projects.create({dbClient,
                projectName,
                serviceName: 'TestService'  
            });
            console.log('Create Project Response:', JSON.stringify(response, null, 2));
            mainMenu();
        });
    };

    const deleteProject = async (databaseManager:any) => {
        rl.question('Enter project name to delete: ', async (projectName) => {
            const response = await databaseManager.projects.delete({
                projectName
                // Other necessary params here
            });
            console.log('Delete Project Response:', JSON.stringify(response, null, 2));
            mainMenu();
        });
    };

    const copyProject = async (databaseManager:any) => {
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

    const checkProjectExists = async (databaseManager:any) => {
        rl.question('Enter project name to check: ', async (projectName) => {
            const response = await databaseManager.projects.exists({
                projectName
                // Other necessary params here
            });
            console.log('Check Project Exists Response:', JSON.stringify(response, null, 2));
            mainMenu();
        });
    };

    mainMenu(); // Start the main menu

};

// Invoke the startApplication function to run the app
startApplication();
