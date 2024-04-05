import { MongoClient } from "mongodb";
import { initializeDbConnection } from "../database/initializeDbConnection";
import { projects } from "../database/projects";

export async function projectTests() {
    let testResults = [] as any;

    console.log("Initializing database connection...");
    const connectionResult = await initializeDbConnection({});
    if (!connectionResult.status) {
        console.error("Failed to initialize database connection:", connectionResult.message);
        testResults.push({ test: "Database Connection", passed: false, message: connectionResult.message });
        return;
    }
    const dbClient: MongoClient = connectionResult.client;
    const testProjectName = "TestProject";
    const testServiceName = "TestService";
    const copyProjectName = "CopyTestProject";

    // Testing project creation
    const createResult = await projects.create({ dbClient, projectName: testProjectName, serviceName: testServiceName });
    testResults.push({ test: "Create Project", passed: createResult.status, message: createResult.message });

    // Testing project existence
    const existsResult = await projects.exists({ dbClient, projectName: testProjectName });
    testResults.push({ test: "Project Exists", passed: existsResult.status, message: existsResult.message });

    // Testing listing all projects
    const listResult = await projects.list({ dbClient });
    testResults.push({ test: "List All Projects", passed: listResult.status, message: listResult.message });

    // Testing copying a project
    const copyResult = await projects.copy({ dbClient, projectName: testProjectName, targetProjectName: copyProjectName });
    testResults.push({ test: "Copy Project", passed: copyResult.status, message: copyResult.message, copyResult });

    // Testing project deletion
    const deleteResult = await projects.delete({ dbClient, projectName: testProjectName });
    testResults.push({ test: "Delete Project", passed: deleteResult.status, message: deleteResult.message });

  //  const deleteCopyResult = await projects.delete({ dbClient, projectName: copyProjectName });
  //  testResults.push({ test: "Delete Copy Project", passed: deleteCopyResult.status, message: deleteCopyResult.message });
    // Testing project creation
  //  const dd = await projects.create({ dbClient, projectName: testProjectName, serviceName: testServiceName });
   // testResults.push({ test: "Create Project", passed: dd.status, message: dd.message });

    dbClient.close();
    return testResults;
}

