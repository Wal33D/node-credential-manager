import { MongoClient } from 'mongodb';
import { CredentialManager } from './path/to/CredentialManager';
import { initializeMongo } from './path/to/yourMongoConnectionInitializer';

async function viewCredentials() {
  try {
    const dbConnection = await initializeMongo(); // Assumed this function connects to your MongoDB and returns the client
    const credentialManager = new CredentialManager(dbConnection);

    await credentialManager.listAllCredentials();
  } catch (error) {
    console.error('Error listing credentials:', error);
  }
}

viewCredentials();
