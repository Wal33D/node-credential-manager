import { addSecret } from "./database/secrets";
import { MongoClient } from "mongodb";
import { addSecretVersion, updateSecretVersion } from "./database/version";
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

  // Create a test project and service
  const createResult = await createProject(dbClient, testProjectName, serviceName);
  if (!createResult.status) {
    console.error("Failed to create test project and service:", createResult.message);
    dbClient.close();
    return;
  }

  // Add a new secret to the database. This tests the creation of a new secret in the specified service and project.
  await testAddSecret(dbClient, testProjectName, "TestService", "TestSecret", "TEST_ENV", "test", testResults);

  // Add a new version (1.1) to the secret. This tests adding a new version to an existing secret.
  await testAddSecretVersion(dbClient, testProjectName, "TestService", "TestSecret", "1.1", "initialValue", testResults);

  // Add another new version (1.2) to the secret. This tests adding multiple versions to the same secret.
  await testAddSecretVersion(dbClient, testProjectName, "TestService", "TestSecret", "1.2", "initialValue", testResults);

  // Update an existing version (1.2) of the secret. This tests the functionality to update the value of an existing version.
  await testUpdateSecretVersion(dbClient, testProjectName, "TestService", "TestSecret", "1.2", "updatedValue", testResults);

  // Attempt to add a duplicate version (1.1) to the secret. This test is designed to fail, ensuring that the system prevents adding duplicate versions.
  await testAddSecretVersion(dbClient, testProjectName, "TestService", "TestSecret", "1.1", "duplicateAttempt", testResults);

  // After all tests
  const deleteResult = await deleteProject(dbClient, testProjectName);
  if (!deleteResult.status) {
    console.error("Failed to delete test project:", deleteResult.message);
  } else {
    console.log(deleteResult.message); // Confirm project deletion
  }

  logFinalResults(testResults);
  dbClient.close();
}

async function testAddSecret(dbClient: any, projectName: any, serviceName: any, secretName: any, envName: any, envType: any, testResults: any) {
  const response = await addSecret({ dbClient, projectName, serviceName, secretName, envName, envType, credentials: [{ version: '1.0', value: 'initialValue' }] });
  testResults.push({ test: "Add Secret", passed: response.status, message: response.message });
}

async function testAddSecretVersion(dbClient: any, projectName: any, serviceName: any, secretName: any, version: any, value: any, testResults: any, expectFailure = false) {
  const response = await addSecretVersion({ dbClient, projectName, serviceName, secretName, version, value });
  const passed = expectFailure ? !response.status : response.status;
  testResults.push({ test: `Add Secret Version ${version}`, passed, message: response.message });
}

async function testUpdateSecretVersion(dbClient: any, projectName: any, serviceName: any, secretName: any, version: any, value: any, testResults: any) {
  const response = await updateSecretVersion({ dbClient, projectName, serviceName, secretName, version, value });
  testResults.push({ test: `Update Secret Version ${version}`, passed: response.status, message: response.message });
}

function logFinalResults(testResults: any) {
  console.log("\nTest Summary:");
  console.log(testResults)
}

secretTests();
