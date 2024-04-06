import { runAllTests } from "./tests/runAllTests";
import { MongoClient } from "mongodb";
import { DatabaseManager } from "./DatabaseManager";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { checkAndGenerateEncryptionKey } from "./encryptionInit";
import { SecretOperationParams } from "./database/databaseTypes";
runAllTests();

export async function startMenu() {
    console.log("Initializing database connection...");
    const connectionResult = await initializeDbConnection({});
    if (!connectionResult.status) {
        console.error("Failed to initialize database connection:", connectionResult.message);
        return;
    }
    const dbClient: MongoClient = connectionResult.client;
    const databaseManager = new DatabaseManager(dbClient);
   const secretTest =  await databaseManager.projects.services.secrets.list({ dbClient:dbClient, projectName: "TestProject", serviceName: "TestService", secretName:"RenamedSecret" } as SecretOperationParams);
    console.log(secretTest);
}
startMenu();
//checkAndGenerateEncryptionKey();

