import ReadlineManager from "../utils/ReadlineManager";
import { runAllTests } from "./tests/runAllTests";
import { projectManagementMenu } from "../menu/projectManagementMenu";
import { serviceManagementMenu } from "../menu/serviceManagementMenu";
import { secretManagementMenu } from "../menu/secretManagementMenu";
import { versionManagementMenu } from "../menu/versionManagementMenu"; // Import the versionManagementMenu
import { initializeDbConnection } from "./database/initializeDbConnection";
import { checkAndGenerateEncryptionKey } from "../utils/encryptionInit";

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

const mainMenu = async (dbClient: any) => {
    console.log('\nMain Menu:');
    console.log('1. Project Management');
    console.log('2. Service Management');
    console.log('3. Secret Management');
    console.log('4. Version Management'); // Add the Version Management option
    console.log('5. Run All Tests');
    console.log('6. Check and Generate Encryption Key');
    console.log('7. Exit');

    const choice = await ReadlineManager.askQuestion('Enter your choice: ');

    switch (choice) {
        case '1':
            await projectManagementMenu(dbClient, mainMenu);
            break;
        case '2':
            await serviceManagementMenu(dbClient, mainMenu);
            break;
        case '3':
            await secretManagementMenu(dbClient, mainMenu);
            break;
        case '4':

            await versionManagementMenu(dbClient,mainMenu);
            break;
        case '5':
            console.log('Running all tests...');
            // Ensure runAllTests is properly implemented to handle async operations
            await runAllTests();
            console.log('Tests completed.');
            await mainMenu(dbClient);
            break;
        case '6':
            console.log('Checking and generating encryption key...');
            // Assuming checkAndGenerateEncryptionKey is properly implemented for async
            await checkAndGenerateEncryptionKey();
            console.log('Operation completed.');
            await mainMenu(dbClient);
            break;
        case '7':
            console.log('Exiting application...');
            ReadlineManager.close();
            if (dbClient && dbClient.close) {
                dbClient.close();
            }
            break;
        default:
            console.log('Invalid choice. Please select a valid option.');
            await mainMenu(dbClient);
    }
};

startApplication();
