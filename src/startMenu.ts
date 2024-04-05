import { addSecret } from "./database/secrets";
import { MongoClient } from "mongodb";
import { version } from "./database/version";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { createProject, deleteProject } from "./database/database";

async function secretTests() {
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

  // Assuming createProject and testAddSecret are defined elsewhere and remain unchanged
  await createProject(dbClient, testProjectName, serviceName);

  // Adjusted to use version.add, version.update, and version.latest
  await testAddSecret(dbClient, testProjectName, serviceName, "TestSecret", "TEST_ENV", "test", testResults);
  await testVersionOperation(version.add, dbClient, testProjectName, serviceName, "TestSecret", "1.1", "initialValue", testResults, "Add Secret Version 1.1");
  await testVersionOperation(version.add, dbClient, testProjectName, serviceName, "TestSecret", "1.2", "initialValue", testResults, "Add Secret Version 1.2");
  await testVersionOperation(version.add, dbClient, testProjectName, serviceName, "TestSecret", "1.2", "initialValue", testResults, "Add Secret Version 1.2"); // should be false
  await testVersionOperation(version.update, dbClient, testProjectName, serviceName, "TestSecret", "1.2", "updatedValue", testResults, "Update Secret Version 1.2");
  await testFindLatestSecretVersion(version.latest, dbClient, testProjectName, serviceName, "TestSecret", "1.2", testResults);
  await testVersionOperation(version.list, dbClient, testProjectName, serviceName, "TestSecret", "1.1", "updatedValue", testResults, "List All Versions");

  await testVersionOperation(version.rollback, dbClient, testProjectName, serviceName, "TestSecret", "1.2", "updatedValue", testResults, "rollback Secret Version 1.2");
  //await testVersionOperation(version.delete, dbClient, testProjectName, serviceName, "TestSecret", "1.1", "updatedValue", testResults, "delete Secret Version 1.2");

  // Assuming deleteProject is defined elsewhere and remains unchanged
  await deleteProject(dbClient, testProjectName);
  logFinalResults(testResults);
  dbClient.close();
}

// This function is adjusted to work with version.add, version.update, and potentially version.latest
async function testVersionOperation(operationFunction: any, dbClient: any, projectName: any, serviceName: any, secretName: any, version: any, value: any, testResults: any, testDescription: any) {
  const params = { dbClient, projectName, serviceName, secretName, version, value };
  const response = await operationFunction(params);
  const passed = response.status;
  testResults.push({ test: testDescription, passed, message: response.message, response });
}

// Adjusted to directly use version.latest
async function testFindLatestSecretVersion(latestFunction: any, dbClient: any, projectName: any, serviceName: any, secretName: any, expectedVersion: any, testResults: any) {
  const params = { dbClient, projectName, serviceName, secretName };
  const response = await latestFunction(params);
  const passed = response.status && response.credential && response.credential.version === expectedVersion;
  testResults.push({
    test: `Find Latest Secret Version for '${secretName}'`,
    passed,
    message: passed ? `Found latest version '${expectedVersion}' as expected.` : `Failed to find the expected latest version '${expectedVersion}'. Found '${response.credential ? response.credential.version : "none"}' instead.`,
    response
  });
}
async function testAddSecret(dbClient: any, projectName: any, serviceName: any, secretName: any, envName: any, envType: any, testResults: any) {
  const response = await addSecret({ dbClient, projectName, serviceName, secretName, envName, envType, version: { version: '1.0', value: 'initialValue' } });
  testResults.push({ test: "Add Secret", passed: response.status, message: response.message, response });
}


function logFinalResults(testResults: any) {
  console.log("\nTest Summary:");
  console.log(JSON.stringify(testResults, null, 2));
}

secretTests();