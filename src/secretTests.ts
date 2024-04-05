import { secrets } from "./database/secrets";
import { MongoClient } from "mongodb";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { createProject, deleteProject } from "./database/database";

export async function secretTests() {
  let testResults = [] as any;
  
  console.log("Initializing database connection...");
  const connectionResult = await initializeDbConnection({});
  if (!connectionResult.status) {
    console.error("Failed to initialize database connection:", connectionResult.message);
    testResults.push({ test: "Database Connection", passed: false, message: connectionResult.message });
    logFinalResults(testResults);
    return;
  }
  const dbClient: MongoClient = connectionResult.client;
  const testProjectName = "TestProject";
  const serviceName = "TestService";

  await createProject(dbClient, testProjectName, serviceName);

  await testAddSecret(dbClient, testProjectName, serviceName, "TestSecret", "TEST_ENV", "test", testResults);
  await testFindSecretByName(dbClient, testProjectName, serviceName, "TestSecret", testResults);
  await testListAllSecrets(dbClient, testProjectName, serviceName, testResults);
  await testDeleteSecrets(dbClient, testProjectName, serviceName, { secretName: "TestSecret" }, testResults);

  await deleteProject(dbClient, testProjectName);

  logFinalResults(testResults);
  dbClient.close();
}

async function testAddSecret(dbClient: any, projectName: any, serviceName: any, secretName: any, envName: any, envType: any, testResults: any) {
  const response = await secrets.add({ dbClient, projectName, serviceName, secretName, envName, envType, versions: [{ versionName: '1.0', value: 'initialValue' }] });
  testResults.push({ test: "Add Secret", passed: response.status, message: response.message,response });
}

async function testFindSecretByName(dbClient: any, projectName: any, serviceName: any, secretName: any, testResults: any) {
  const response = await secrets.findByName({ dbClient, projectName, serviceName, secretName });
  testResults.push({ test: "Find Secret By Name", passed: response.status,response });
}

async function testListAllSecrets(dbClient: any, projectName: any, serviceName: any, testResults: any) {
  const response = await secrets.list({ dbClient, projectName, serviceName });
  testResults.push({ test: "List All Secrets", passed: response.status,response });
}

async function testDeleteSecrets(dbClient: any, projectName: any, serviceName: any, filter: any, testResults: any) {
  const response = await secrets.delete({ dbClient, projectName, serviceName, filter });
  testResults.push({ test: "Delete Secrets", passed: response.status,response });
}

function logFinalResults(testResults: any) {
  console.log("\nTest Summary:");
  console.log(JSON.stringify(testResults, null, 2));
}

secretTests();
