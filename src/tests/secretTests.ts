import { secrets } from "../database/secrets";
import { MongoClient } from "mongodb";
import { initializeDbConnection } from "../database/initializeDbConnection";
import { projects } from "../database/projects";

export async function secretTests() {
    let testResults = [] as any;

   // console.log("Initializing database connection...");
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
    await testFindSecretByName(dbClient, testProjectName, serviceName, "TestSecret", testResults);
    await testRenameSecret(dbClient, testProjectName, serviceName, "TestSecret", "RenamedSecret", testResults);
    await testFindSecretByName(dbClient, testProjectName, serviceName, "RenamedSecret", testResults);
    await testListAllSecrets(dbClient, testProjectName, serviceName, testResults);
    await testDuplicateSecretNames(dbClient, testProjectName, serviceName, testResults);
    await testDeleteSecrets(dbClient, testProjectName, serviceName, { secretName: "TestSecret" }, testResults);
    await testDeleteSecrets(dbClient, testProjectName, serviceName, { secretName: "RenamedSecret" }, testResults);

    await projects.delete({ dbClient, projectName: testProjectName });

    dbClient.close();
    //console.log(JSON.stringify(testResults, null, 2));
    return testResults
}

async function testAddSecret(dbClient: any, projectName: any, serviceName: any, secretName: any, envName: any, envType: any, testResults: any) {
    const response = await secrets.add({ dbClient, projectName, serviceName, secretName, envName, envType, versions: [{ versionName: '1.0', value: 'initialValue' }] });
    testResults.push({ test: "Adding Secret: " + secretName, passed: response.status, message: response.message, response });
}

async function testFindSecretByName(dbClient: any, projectName: any, serviceName: any, secretName: any, testResults: any) {
    const response = await secrets.findByName({ dbClient, projectName, serviceName, secretName });
    testResults.push({ test: "Finding Secret By Name: " + secretName, passed: response.status, message: response.message, response });
}

async function testListAllSecrets(dbClient: any, projectName: any, serviceName: any, testResults: any) {
    const response = await secrets.list({ dbClient, projectName, serviceName });
    testResults.push({ test: "Listing All Secrets", passed: response.status, message: response.message, response });
}

async function testDeleteSecrets(dbClient: any, projectName: any, serviceName: any, filter: any, testResults: any) {
    const response = await secrets.delete({ dbClient, projectName, serviceName, filter });
    testResults.push({ test: "Deleting Secret: " + JSON.stringify(filter), passed: response.status, message: response.message, response });
}

async function testRenameSecret(dbClient: any, projectName: any, serviceName: any, originalSecretName: any, newSecretName: any, testResults: any) {
    const response = await secrets.rename({ dbClient, projectName, serviceName, secretName: originalSecretName, newSecretName });
    testResults.push({ test: `Renaming Secret: ${originalSecretName} to ${newSecretName}`, passed: response.status, message: response.message, response });
    if (response.status) {
        // If rename was successful, verify the new name
        const verifyResponse = await secrets.findByName({ dbClient, projectName, serviceName, secretName: newSecretName });
        const verificationPassed = verifyResponse.status && verifyResponse.secret?.secretName === newSecretName;
        testResults.push({ test: "Verify Rename Operation", passed: verificationPassed, message: verificationPassed ? `Secret renamed and verified as ${newSecretName}.` : "Secret rename verification failed." });
    }
}

async function testDuplicateSecretNames(dbClient: any, projectName: any, serviceName: any, testResults: any) {
    const response = await secrets.list({ dbClient, projectName, serviceName });
    if (response.status && response.secrets) {
        const secretNames = response.secrets.map(secret => secret.secretName);
        const duplicates = secretNames.filter((name, index) => secretNames.indexOf(name) !== index);

        if (duplicates.length > 0) {
            testResults.push({ test: "Check for Duplicate Secret Names", passed: false, message: `Duplicate secret names found: ${duplicates.join(', ')}.`, response });
        } else {
            testResults.push({ test: "Check for Duplicate Secret Names", passed: true, message: "No duplicate secret names found.", response });
        }
    } else {
        testResults.push({ test: "Check for Duplicate Secret Names", passed: false, message: "Failed to retrieve secrets for duplicate name check.", response });
    }
}

