import { secrets } from "./database/secrets";
import { MongoClient } from "mongodb";
import { version } from "./database/version";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { createProject, deleteProject } from "./database/database";
import { secretTests } from "./secretTests";

export async function versionTests() {
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

  // Adjusted to use version.add, version.update, version.latest, version.list, version.rollback, version.delete
  await testAddSecret(dbClient, testProjectName, serviceName, "TestSecret", "TEST_ENV", "test", testResults);
  await testVersionOperation(version.add, dbClient, testProjectName, serviceName, "TestSecret", "1.1", "initialValue", testResults, "Add Version 1.1");
  await testVersionOperation(version.add, dbClient, testProjectName, serviceName, "TestSecret", "1.2", "initialValue", testResults, "Add Version 1.2");
  await testVersionOperation(version.update, dbClient, testProjectName, serviceName, "TestSecret", "1.2", "updatedValue", testResults, "Update Version 1.2");
  await testFindLatestSecretVersion(version.latest, dbClient, testProjectName, serviceName, "TestSecret", "1.2", testResults);
  await testVersionOperation(version.list, dbClient, testProjectName, serviceName, "TestSecret", "", "", testResults, "List All Versions");
  await testVersionOperation(version.rollback, dbClient, testProjectName, serviceName, "TestSecret", "", "", testResults, "Rollback Latest Version");
  await testVersionOperation(version.delete, dbClient, testProjectName, serviceName, "TestSecret", "1.1", "", testResults, "Delete Version 1.1");
  
  await deleteProject(dbClient, testProjectName);

  logFinalResults(testResults);
  dbClient.close();
}

async function testVersionOperation(operationFunction: any, dbClient: any, projectName: any, serviceName: any, secretName: any, versionName: any, value: any, testResults: any, testDescription: string) {
  const params = { dbClient, projectName, serviceName, secretName, versionName, value };
  const response = await operationFunction(params);
  testResults.push({ test: testDescription, passed: response.status, message: response.message });
}

async function testFindLatestSecretVersion(latestFunction: any, dbClient: any, projectName: any, serviceName: any, secretName: any, expectedVersion: any, testResults: any) {
  const params = { dbClient, projectName, serviceName, secretName };
  const response = await latestFunction(params);
  const passed = response.status && response.version && response.version.versionName === expectedVersion;
  testResults.push({
    test: `Find Latest Version for '${secretName}'`,
    passed,
    message: response.message
  });
}

async function testAddSecret(dbClient: any, projectName: any, serviceName: any, secretName: any, envName: any, envType: any, testResults: any) {
  const response = await secrets.add({ dbClient, projectName, serviceName, secretName, envName, envType, versions: [{ versionName: '1.0', value: 'initialValue' }] });
  testResults.push({ test: "Add Secret", passed: response.status, message: response.message });
}

function logFinalResults(testResults: any) {
  let passCount = testResults.filter((result: any) => result.passed).length;
  let failCount = testResults.filter((result: any) => !result.passed).length;
  console.log("\nTest Summary:");
  testResults.forEach((result: any) => {
    console.log(`${result.test}: ${result.passed ? "PASS" : "FAIL"} - ${result.message}`);
  });
  console.log(`\nTotal: ${testResults.length}, Passed: ${passCount}, Failed: ${failCount}`);
}

versionTests();
//secretTests();