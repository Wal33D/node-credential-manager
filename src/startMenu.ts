// Import necessary modules and functions
import { runAllTests } from "./tests/runAllTests";
import { MongoClient } from "mongodb";
import { createDatabaseManager } from "./DatabaseManager";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { checkAndGenerateEncryptionKey } from "./encryptionInit";
import readline from "readline";

// Create a Readline Interface for CLI interaction
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Main function to start the menu
export async function startMenu() {
    console.log("Credential Manager");
    console.log("Initializing database connection...");

    // Initialize Database Connection
    const connectionResult = await initializeDbConnection({});
    if (!connectionResult.status) {
        console.error("Failed to initialize database connection:", connectionResult.message);
        rl.close();
        return;
    }

    // If connection is successful
    const dbClient: MongoClient = connectionResult.client;
    const projectName = "TestProject"; 
    const serviceName = "TestService"; 
    const secretName = "RenamedSecret";
    const databaseManager = await createDatabaseManager(dbClient);

    // Main menu function
    function mainMenu() {
        console.log(`
Choose an action:
1. List Secrets
2. Add Secret
3. Run All Tests
4. Exit
        `);
//databaseManager.projects.services.secrets.versions
        rl.question("Enter option number: ", async (option) => {
            switch (option) {
                case '1':
                    const response = await await databaseManager.projects.services.secrets.versions.latest({
                        dbClient,
                        projectName,
                        serviceName,
                        secretName
                        
                    });
                    console.log("Secrets List:", JSON.stringify(response, null, 2));
                    mainMenu();
                    break;
                case '2':
                    // Placeholder for add secret functionality
                    console.log("Add Secret functionality not implemented.");
                    mainMenu();
                    break;
                case '3':
                    await runAllTests();
                    mainMenu();
                    break;
                case '4':
                    console.log("Exiting Credential Manager...");
                    rl.close();
                    break;
                default:
                    console.log("Invalid option, please choose again.");
                    mainMenu();
            }
        });
    }

    mainMenu(); // Invoke the main menu
}

// Run the start menu
startMenu();

// Check and generate encryption key
checkAndGenerateEncryptionKey();
3