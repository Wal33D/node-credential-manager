require('dotenv').config({ path: './.env.local' });

import { MongoClient } from 'mongodb';
import { ProjectManager } from './ProjectManager';

const defaultProjectName = process.env.DEFAULT_OFFICE_NAME || "DefaultProject";
const globalDbConfig = {
  dbUsername: process.env.DB_USERNAME || "admin",
  dbPassword: process.env.DB_PASSWORD || "password",
  dbCluster: process.env.DB_CLUSTER || "cluster0.example.mongodb.net",
};

export const projects = new Map();

const connectionString = ({ dbUsername, dbPassword, dbCluster }:{ dbUsername:any, dbPassword:any, dbCluster:any }) => 
  `mongodb+srv://${encodeURIComponent(dbUsername)}:${encodeURIComponent(dbPassword)}@${dbCluster}`;

const listAllDatabases = async (config:any) => {
  const client = new MongoClient(connectionString(config));
  try {
    await client.connect();
    const databasesList = await client.db().admin().listDatabases();
    const filteredDatabases = databasesList.databases
      .map(db => db.name)
      .filter(name => name !== 'admin' && name !== 'local');
    return filteredDatabases;
  } finally {
    await client.close();
  }
};

export const addProject = async (projectName:any, config:any) => {
  if (projects.has(projectName)) {
    console.log(`Project '${projectName}' already exists in the Credential Manager.`);
    return;
  }

  const projectManager = new ProjectManager({ projectName, ...config });
  try {
    await projectManager.ensureConnection();
    projects.set(projectName, projectManager);
    console.log(`Project '${projectName}' has been successfully added and connected.`);
  } catch (error:any) {
    console.error(`Failed to initialize project '${projectName}': ${error.message}`);
  }
};

export const initializeAllProjects = async (config:any) => {
  const databaseNames = await listAllDatabases(config);
  let metadataFound = false;

  for (const dbName of databaseNames) {
    const projectManager = new ProjectManager({
      projectName: dbName,
      ...config,
    });

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
    await addProject(defaultProjectName, config);

    const defaultProjectManager = projects.get(defaultProjectName);
    if (defaultProjectManager) {
      await defaultProjectManager.ensureAppMetadata();
    }
  }
};

initializeAllProjects(globalDbConfig).then(() => console.log('All projects have been initialized.'));
