import { MongoClient } from "mongodb";
import { initializeDbConnection } from "../database/initializeDbConnection";
import { projects } from "../database/projects";
import { services } from "../database/services";

export async function serviceTests() {
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

    await testListServices(dbClient, testProjectName, testResults);
    await testAddNewService(dbClient, testProjectName, "NewService", testResults);
    await testRenameService(dbClient, testProjectName, "NewService", "RenamedService", testResults);
    await testServiceExists(dbClient, testProjectName, "RenamedService", testResults);
    await testFindService(dbClient, testProjectName, "RenamedService", testResults);

    await testRemoveService(dbClient, testProjectName, "RenamedService", testResults);

    await projects.delete({ dbClient, projectName: testProjectName });

    dbClient.close();
    return testResults;
}

async function testListServices(dbClient:any, projectName:any, testResults:any) {
    const response = await services.list({ dbClient, projectName });
    testResults.push({ test: "List Services", passed: response.status, message: response.message });
}

async function testAddNewService(dbClient:any, projectName:any, serviceName:any, testResults:any) {
    const response = await services.add({ dbClient, projectName, serviceName });
    testResults.push({ test: `Add New Service: ${serviceName}`, passed: response.status, message: response.message });
}

async function testRenameService(dbClient:any, projectName:any, oldServiceName:any, newServiceName:any, testResults:any) {
    const response = await services.rename({ dbClient, projectName, serviceName: oldServiceName, newServiceName });
    testResults.push({ test: `Rename Service from ${oldServiceName} to ${newServiceName}`, passed: response.status, message: response.message });
}

async function testServiceExists(dbClient:any, projectName:any, serviceName:any, testResults:any) {
    const response = await services.exists({ dbClient, projectName, serviceName });
    testResults.push({ test: `Service Exists: ${serviceName}`, passed: response.status, message: response.message });
}
async function testFindService(dbClient:any, projectName:any, serviceName:any, testResults:any) {
    const response = await services.getService({ dbClient, projectName, serviceName });
    testResults.push({ test: `Found Service: ${serviceName}`, passed: response.status, message: response.message });
}
async function testRemoveService(dbClient:any, projectName:any, serviceName:any, testResults:any) {
    const response = await services.remove({ dbClient, projectName, serviceName });
    testResults.push({ test: `Remove Service: ${serviceName}`, passed: response.status, message: response.message });
}

