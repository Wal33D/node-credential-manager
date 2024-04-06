import ReadlineManager from "./utils/ReadlineManager"; 
import { runAllTests } from "./tests/runAllTests";
import { projectManagementMenu } from "./projectManagementMenu";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { checkAndGenerateEncryptionKey } from "./utils/encryptionInit";

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
    console.log('2. Run All Tests');
    console.log('3. Check and Generate Encryption Key');
    console.log('4. Exit');

    const choice = await ReadlineManager.askQuestion('Enter your choice: ');
    let result;

    switch (choice) {
        case '1':
            await projectManagementMenu(dbClient);
            break;
        case '2':
            console.log('Running all tests...');
            result = await runAllTests();
            console.log('Tests completed.', result.completeResult);
            await mainMenu(dbClient);
            break;
        case '3':
            console.log('Checking and generating encryption key...');
            result =  await checkAndGenerateEncryptionKey();
            console.log('Operation completed.', result);
            await mainMenu(dbClient);
            break;
        case '4':
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
