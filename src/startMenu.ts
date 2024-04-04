import { initializeDbConnection } from "./database/initializeDbConnection";
import { listAllProjects, createProject, deleteProject } from "./database/database";
import { listServices, removeService } from "./database/collections";
import { addSecret, findSecretByName } from "./database/documents";
// Simulating some operations for demo purposes
async function startMenuDemo() {
  const defaultProjectName = process.env.DEFAULT_PROJECT_NAME || "DefaultProject";

  console.log("Initializing database connection...");
  const dbClient = await initializeDbConnection({/* Your connection params */});

  console.log("Listing all projects...");
  await listAllProjects(dbClient);

  console.log(`Creating a new project: ${defaultProjectName}...`);
  await createProject(dbClient, defaultProjectName, "DemoService");
  
  console.log("Listing all services in the project...");
  await listServices(dbClient, defaultProjectName);

  const secretData = {
    name: "DemoSecret",
    envType: "production",
    value: "sampleSecretValue",
    createdAt: new Date()
  };
  
  console.log(`Adding a new secret to 'DemoService'...`);
  await addSecret(dbClient, defaultProjectName, "DemoService", secretData);
  
  console.log(`Finding 'DemoSecret' in 'DemoService'...`);
  await findSecretByName({dbClient, projectName:defaultProjectName, serviceName:"DemoService", secretName:"DemoSecret"});

  // Add more operations as needed for your demo...
  
  console.log("Cleaning up: removing service...");
  await removeService(dbClient, defaultProjectName, "DemoService");
  
  console.log("Cleaning up: dropping project...");
  await deleteProject(dbClient, defaultProjectName);

  console.log('Exiting application...');
  process.exit(0);
}

startMenuDemo();
