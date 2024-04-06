import { runAllTests } from "./tests/runAllTests";
import { MongoClient } from "mongodb";
import { DatabaseManager } from "./DatabaseManager";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { checkAndGenerateEncryptionKey } from "./encryptionInit";

export async function startMenu() {
    console.log("Initializing database connection...");
    const connectionResult = await initializeDbConnection({});
    if (!connectionResult.status) {
        console.error("Failed to initialize database connection:", connectionResult.message);
        return;
    }
    const dbClient: MongoClient = connectionResult.client;
    const databaseManager = new DatabaseManager(dbClient);

    console.log(databaseManager)
}

//runAllTests();
//checkAndGenerateEncryptionKey();

