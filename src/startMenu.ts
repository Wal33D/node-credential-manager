
require('dotenv').config({ path: './.env' });
import { initializeDbConnection } from "./database/initializeDbConnection";
import { listAllProjects, createProject, deleteProject } from "./database/database";
import { listServices, removeService } from "./database/collections";
import { addSecret, countSecretsInCollection, findSecretByName, updateSecretInCollection } from "./database/documents";
import { Secret } from "./database/types";
import { MongoClient, ObjectId } from "mongodb";

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

  const secretData: Secret = {
    _id: new ObjectId(),
    SecretName: "DemoSecret",
    envName: "DemoEnvironment",
    envType: "production",
    values: {
      "1.0.0": { value: "sampleSecretValue" },
    },
    updatedAt: new Date(),
    createdAt: new Date(),
    lastAccessAt: new Date(),
  };

  console.log(`Adding a new secret to 'DemoService'...`);
  await addSecret(dbClient, defaultProjectName, "DemoService", secretData);

  console.log(`Updating 'DemoSecret' in 'DemoService'...`);
  await updateSecretInCollection(dbClient, defaultProjectName, "DemoService", { SecretName: "DemoSecret" }, { $set: { "values.1.0.1": { value: "updatedValue" } } });

  console.log(`Counting secrets in 'DemoService'...`);
  await countSecretsInCollection(dbClient, defaultProjectName, "DemoService", {});

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
