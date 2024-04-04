require('dotenv').config({ path: './.env' });
import { addSecret } from "./database/secrets";
import { MongoClient } from "mongodb";
import { addSecretVersion, updateSecretVersion } from "./database/version";
import { initializeDbConnection } from "./database/initializeDbConnection";

async function secretTests() {
  let testResults = [];

  console.log("Initializing database connection...");
  const connectionResult = await initializeDbConnection({});
  if (!connectionResult.status) {
    console.error("Failed to initialize database connection:", connectionResult.message);
    testResults.push({ test: "Database Connection", passed: false, message: connectionResult.message });
    logFinalResults(testResults);
    return;
  }
  const dbClient: MongoClient = connectionResult.client;
  const defaultProjectName = process.env.DEFAULT_PROJECT_NAME || "DefaultProject";

  // Add a new secret
  const secretAddResponse = await addSecret({dbClient, projectName:defaultProjectName, serviceName:"DemoService", secretName:"DemoSecret", envName:"DEMO_SECRET", envType:"production", [{ version: '1.0', value: 'initialValue' }]});
  testResults.push({ test: "Add Secret", passed: secretAddResponse.status, message: secretAddResponse.message });

  // Add a new version
  const addVersionResponse = await addSecretVersion({
    dbClient,
    projectName: defaultProjectName,
    serviceName: "DemoService",
    secretName: "DemoSecret",
    version: "1.0.1",
    newValue: "newValue"
  });
  testResults.push({ test: "Add Secret Version", passed: addVersionResponse.status, message: addVersionResponse.message });

  // Attempt to add a duplicate version (should fail)
  const addDuplicateVersionResponse = await addSecretVersion({
    dbClient,
    projectName: defaultProjectName,
    serviceName: "DemoService",
    secretName: "DemoSecret",
    version: "1.0.1",
    newValue: "duplicateValue"
  });
  testResults.push({ test: "Add Duplicate Secret Version", passed: !addDuplicateVersionResponse.status, message: addDuplicateVersionResponse.message });

  // Update an existing version
  const updateVersionResponse = await updateSecretVersion({
    dbClient,
    projectName: defaultProjectName,
    serviceName: "DemoService",
    secretName: "DemoSecret",
    version: "1.0.1",
    newValue: "updatedValue"
  });
  testResults.push({ test: "Update Secret Version", passed: updateVersionResponse.status, message: updateVersionResponse.message });

  logFinalResults(testResults);
  dbClient.close();
}

function logFinalResults(testResults) {
  console.log("\nTest Summary:");
  testResults.forEach(result => {
    console.log(`${result.test}: ${result.passed ? "
