
require('dotenv').config({ path: './.env' });
import { initializeDbConnection } from "./database/initializeDbConnection";
import { listAllProjects, createProject } from "./database/database";
import { listServices } from "./database/collections";
import { addSecret, findSecretByName } from "./database/secrets";
import { addSecretVersion, updateSecretVersion } from "./database/version";
import { MongoClient } from "mongodb";

async function startMenuDemo() {
  console.log("Initializing database connection...");
  const connectionResult = await initializeDbConnection({});
  if (!connectionResult.status) {
    console.error("Failed to initialize database connection:", connectionResult.message);
    return;
  }
  const dbClient: MongoClient = connectionResult.client;

  const defaultProjectName = process.env.DEFAULT_PROJECT_NAME || "DefaultProject" as string;
  console.log("Listing all projects...");
  await listAllProjects(dbClient);

  console.log(`Creating a new project: ${defaultProjectName}...`);
  await createProject(dbClient, defaultProjectName, "DemoService");

  console.log("Listing all services in the project...");
  await listServices(dbClient, defaultProjectName);

  console.log(`Adding a new secret to 'DemoService'...`);

  // Constructing secret data as individual arguments
  const secretName = "DemoSecret";
  const envName = "DemoEnvironment";
  const envType = "production";

  await addSecret(dbClient, defaultProjectName, "DemoService", secretName, envName, envType, [{ version: '1.0.3', value: 'mySecretValue' }]
  );


  const addSecretVersionResponse = await addSecretVersion({
    dbClient: dbClient,
    projectName: "SomnusLabs",
    serviceName: "DemoService",
    secretName: "DemoSecret",
    version: "1.0.4",
    newValue: "yourNewSecretValue"
  });

  console.log(`Adding version '1.0.1' to 'DemoSecret' in 'DemoService':`, JSON.stringify(addSecretVersionResponse, null, 2));
  // Update a secret version using the previously defined function
  const updateSecretVersionResponse = await updateSecretVersion({
    dbClient: dbClient,
    projectName: "SomnusLabs",
    serviceName: "DemoService",
    secretName: "DemoSecret",
    version: "1.0.2", // Assuming you want to update to a new version or modify the existing one
    newValue: "yourUpdatedSecretValue" // New value for the specified version
  });

  // Log the result of the update operation
  console.log(`Updating version '1.0.2' for 'DemoSecret' in 'DemoService':`, JSON.stringify(updateSecretVersionResponse, null, 2));


  console.log(`Finding 'DemoSecret' in 'DemoService'...`);
  await findSecretByName({ dbClient, projectName: defaultProjectName, serviceName: "DemoService", secretName: "DemoSecret" });

  console.log("Cleaning up: removing 'DemoService'...");
  //await removeService(dbClient, defaultProjectName, "DemoService");

  console.log(`Cleaning up: dropping project '${defaultProjectName}'...`);
  //await deleteProject(dbClient, defaultProjectName);

  console.log('Exiting application...');
  process.exit(0);
}

startMenuDemo();
