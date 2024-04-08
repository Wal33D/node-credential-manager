import ReadlineManager from "../utils/ReadlineManager";
import { runAllTests } from "./tests/runAllTests";
import { projectManagementMenu } from "../menu/projectManagementMenu";
import { serviceManagementMenu } from "../menu/serviceManagementMenu";
import { secretManagementMenu } from "../menu/secretManagementMenu";
import { versionManagementMenu } from "../menu/versionManagementMenu"; // Import the versionManagementMenu
import { initializeDbConnection } from "./database/initializeDbConnection";
import { checkAndGenerateEncryptionKey } from "../utils/encryptionInit";
import { seedDemoDB } from "./functions/seedDemoDB";
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
    console.log('4. Version Management');
    console.log('5. Run All Tests');
    console.log('6. Check and Generate Encryption Key');
    console.log('7. Seed DB w/Sample Project Data');

    console.log('8. Exit');

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

            await versionManagementMenu(dbClient, mainMenu);
            break;
        case '5':
            startApplication();
            console.log('Running all tests...');
            const result = await runAllTests();
            console.log('Tests completed.', result.completeResult);
            await mainMenu(dbClient);
            break;
        case '6':
            console.log('Checking and generating encryption key...');
            const encryptionResult = await checkAndGenerateEncryptionKey();
            console.log('Operation completed.', encryptionResult.filePath);
            await mainMenu(dbClient);
            break;
        case '7':
            console.log('Starting database seeding...');
            await seedDemoDB(dbClient);
            console.log('Database seeding completed.');
            await mainMenu(dbClient);            
            break;
        case '8':
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
