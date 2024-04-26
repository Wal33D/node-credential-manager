import { secrets } from "../database/secrets";
import { MongoClient } from "mongodb";
import { versions } from "../database/versions";
import { initializeDbConnection } from "../database/initializeDbConnection";
import { projects } from "../database/projects";

export async function versionTests() {
  let testResults = [] as any;
  const connectionResult = await initializeDbConnection({});
  if (!connectionResult.status) {
    console.error("Failed to initialize database connection:", connectionResult.message);
    testResults.push({ test: "Database Connection", passed: false, message: connectionResult.message });
    return;
  }
  const dbClient: MongoClient = connectionResult.client;
  const testProjectName = "TestProject";
  const serviceName = "TestService";

  await projects.create({ dbClient, projectName: testProjectName, serviceName });

  await testAddSecret(dbClient, testProjectName, serviceName, "TestSecret", "TEST_ENV", "test", testResults);
  await testVersionOperation(versions.add, dbClient, testProjectName, serviceName, "TestSecret", "1.1", "initialValue", testResults, "Add Version 1.1");
  await testVersionOperation(versions.add, dbClient, testProjectName, serviceName, "TestSecret", "1.2", "initialValue", testResults, "Add Version 1.2");
  await testVersionOperation(versions.update, dbClient, testProjectName, serviceName, "TestSecret", "v1.2", "v1.3", testResults, "Change Version 1.2 to 1.3");
  await testFindLatestSecretVersion(versions.latest, dbClient, testProjectName, serviceName, "TestSecret", "1.3", testResults);
  await testVersionOperation(versions.list, dbClient, testProjectName, serviceName, "TestSecret", "", "", testResults, "List All Versions");
  await testVersionOperation(versions.rollback, dbClient, testProjectName, serviceName, "TestSecret", "", "", testResults, "Rollback Latest Version");
  await testVersionOperation(versions.delete, dbClient, testProjectName, serviceName, "TestSecret", "1.1", "", testResults, "Delete Version 1.1");
  await projects.delete({ dbClient, projectName: testProjectName, serviceName });
  dbClient.close();
  console.log(testResults)
  return testResults;
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
