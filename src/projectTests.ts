import { MongoClient } from "mongodb";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { projects } from "./database/projects";

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
    const createResult = await projects.createProject({ dbClient, projectName: testProjectName, serviceName: testServiceName });
    testResults.push({ test: "Create Project", passed: createResult.status, createResult });

    // Testing project existence
    const existsResult = await projects.projectExists({ dbClient, projectName: testProjectName });
    testResults.push({ test: "Project Exists", passed: existsResult.status,existsResult });

    // Testing listing all projects
    const listResult = await projects.listAllProjects({ dbClient });
    testResults.push({ test: "List All Projects", passed: listResult.status,listResult });

    // Testing copying a project
    const copyResult = await projects.copyProject({ dbClient, projectName: testProjectName, targetProjectName: copyProjectName });
    testResults.push({ test: "Copy Project", passed: copyResult.status, copyResult });

    // Testing project deletion
    const deleteResult = await projects.deleteProject({ dbClient, projectName: testProjectName });
    testResults.push({ test: "Delete Project", passed: deleteResult.status, copyResult });

    const deleteCopyResult = await projects.deleteProject({ dbClient, projectName: copyProjectName });
    testResults.push({ test: "Delete Copy Project", passed: deleteCopyResult.status, deleteCopyResult });
 // Testing project creation
 const dd = await projects.createProject({ dbClient, projectName: testProjectName, serviceName: testServiceName });
 testResults.push({ test: "Create Project", passed: dd.status, message: dd.message, dd });
 console.log(dd)

    dbClient.close();
    return testResults;
}

