import { MongoClient } from "mongodb";
import { initializeDbConnection } from "./database/initializeDbConnection";
import { projects } from "./database/projects";

export async function projectTests() {
  let testResults: any[] = [];

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
  const testServiceName = "TestService";
  const copyProjectName = "CopyTestProject";

  // Testing project creation
  const createResult = await projects.createProject({ dbClient, projectName: testProjectName, serviceName: testServiceName });
  testResults.push({ test: "Create Project", passed: createResult.status, message: createResult.message });

  // Testing project existence
  const existsResult = await projects.projectExists({ dbClient, projectName: testProjectName });
  testResults.push({ test: "Project Exists", passed: existsResult.status, message: existsResult.message });

  // Testing listing all projects
  const listResult = await projects.listAllProjects({ dbClient });
  testResults.push({ test: "List All Projects", passed: listResult.status, message: listResult.message });

  // Testing copying a project
  const copyResult = await projects.copyProject({ dbClient, projectName: testProjectName, targetProjectName: copyProjectName });
  testResults.push({ test: "Copy Project", passed: copyResult.status, message: copyResult.message });

  // Testing project deletion
  const deleteResult = await projects.deleteProject({ dbClient, projectName: testProjectName });
  testResults.push({ test: "Delete Project", passed: deleteResult.status, message: deleteResult.message });

  const deleteCopyResult = await projects.deleteProject({ dbClient, projectName: copyProjectName });
  testResults.push({ test: "Delete Copy Project", passed: deleteCopyResult.status, message: deleteCopyResult.message });

  logFinalResults(testResults);
  dbClient.close();
  return testResults;
}

function logFinalResults(testResults: any[]) {
  let passCount = testResults.filter(result => result.passed).length;
  let failCount = testResults.length - passCount;
  console.log("\nTest Summary:");
  testResults.forEach(result => {
    console.log(`${result.test}: ${result.passed ? "PASS" : "FAIL"} - ${result.message}`);
  });
  console.log(`\nTotal: ${testResults.length}, Passed: ${passCount}, Failed: ${failCount}`);
}

projectTests();
