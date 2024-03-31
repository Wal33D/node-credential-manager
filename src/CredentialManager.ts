import { Db } from 'mongodb';
import {initializeDB} from './functions/initializeDB';
import {createCredentialsCollection} from './functions/createCredentialsCollection';
import {getAllCredentials} from './functions/getAllCredentials';

let collectionName = 'testKeys';

class CredentialManager {
  dbConnection: Db | null = null;
  initDBPromise: Promise<void>;

  constructor() {
    this.initDBPromise = this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    // Bind this context to ensure the function can access the class properties
    await initializeDB.apply(this);
  }

  public async ensureDBInit(): Promise<void> {
    await this.initDBPromise;
  }

  // Use arrow functions to maintain the lexical scope for `this`
  createCredentialsCollection = (collectionName: string) => createCredentialsCollection(this.dbConnection, collectionName);
  getAllCredentials = () => getAllCredentials(this.dbConnection, collectionName);
}

export { CredentialManager };
