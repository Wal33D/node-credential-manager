import { runAllTests } from "./tests/runAllTests";
import { MongoClient } from "mongodb";
import { createDatabaseManager } from "./DatabaseManager";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { checkAndGenerateEncryptionKey } from "./encryptionInit";
import { SecretOperationParams } from "./database/databaseTypes";
import {secrets} from "./database/secrets";

export async function startMenu() {
    console.log("Initializing database connection...");
    const connectionResult = await initializeDbConnection({});
    if (!connectionResult.status) {
        console.error("Failed to initialize database connection:", connectionResult.message);
        return;
    }
    const dbClient: MongoClient = connectionResult.client;
    const projectName = "TestProject";
    const serviceName = "TestService";
    const databaseManager = await createDatabaseManager(dbClient);
    const secretTest = await databaseManager.projects.services.secrets.list({
        dbClient,
        projectName,
        serviceName,
    });
    const response = await secrets.list({ dbClient, projectName, serviceName });

    console.log(response);

    console.log(secretTest);
}
startMenu();
//checkAndGenerateEncryptionKey();
//runAllTests();

