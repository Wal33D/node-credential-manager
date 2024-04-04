require('dotenv').config({ path: './.env.local' });

import { MongoClient } from 'mongodb';
import { ProjectManager } from './ProjectManager';

const defaultProjectName = process.env.DEFAULT_OFFICE_NAME || "DefaultProject";

// Initialize the MongoDB client connection with the environment variables
const initializeDbConnection = () => {
  const dbUsername = process.env.DB_USERNAME || "admin";
  const dbPassword = process.env.DB_PASSWORD || "password";
  const dbCluster = process.env.DB_CLUSTER || "cluster0.example.mongodb.net";

  const uri = `mongodb+srv://${encodeURIComponent(dbUsername)}:${encodeURIComponent(dbPassword)}@${dbCluster}`;
  return new MongoClient(uri);
};

export const projects = new Map();

const listAllDatabases = async (client:any) => {
  try {
    await client.connect();
    const databasesList = await client.db().admin().listDatabases();
    const filteredDatabases = databasesList.databases
      .map((db: { name: any; }) => db.name)
      .filter((name: string) => name !== 'admin' && name !== 'local');
    return filteredDatabases;
  } finally {
    await client.close();
  }
};

export const addProject = async (projectName:any, client:any) => {
  if (projects.has(projectName)) {
    console.log(`Project '${projectName}' already exists in the Credential Manager.`);
    return;
  }

  const projectManager = new ProjectManager({ projectName, client });
  try {
    await projectManager.ensureConnection();
    projects.set(projectName, projectManager);
    console.log(`Project '${projectName}' has been successfully added and connected.`);
  } catch (error:any) {
    console.error(`Failed to initialize project '${projectName}': ${error.message}`);
  }
};

export const initializeAllProjects = async () => {
  const client = initializeDbConnection();
  const databaseNames = await listAllDatabases(client as any);
  let metadataFound = false;

  for (const dbName of databaseNames) {
    const projectManager = new ProjectManager({ projectName: dbName, client });

    await projectManager.ensureConnection();
    const hasMetadata = await projectManager.collectionExists("_appMetadata");

    if (hasMetadata) {
      projects.set(dbName, projectManager);
      console.log(`Project '${dbName}' loaded into Credential Manager.`);
      metadataFound = true;
      break;
    }
  }

  if (!metadataFound) {
    console.log("Creating the default project with _appMetadata...");
    await addProject(defaultProjectName, client as any);

    const defaultProjectManager = projects.get(defaultProjectName);
    if (defaultProjectManager) {
      await defaultProjectManager.ensureAppMetadata();
    }
  }
};
