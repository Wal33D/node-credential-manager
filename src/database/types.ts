import { MongoClient, Db } from "mongodb";

// Common Interface for basic operation responses
export interface OperationResponse {
  status: boolean;
  message: string;
  data?: any; // Optional and can be any export type depending on the operation
}

// Interface for the initial DB connection parameters
export interface InitializeDbParams {
  dbUsername?: string;
  dbPassword?: string;
  dbCluster?: string;
}

// Type for the action function used in databaseOperation
export type DbAction = (db: Db) => Promise<OperationResponse>;

// Interface for finding a document by name
export interface FindDocumentParams {
  dbClient: MongoClient;
  dbName: string;
  collectionName: string;
  documentName: string;
}

// Interface for database copy operation
export interface CopyDatabaseParams {
  dbClient: MongoClient;
  sourceDbName: string;
  targetDbName: string;
}

// Interface for updating documents in a collection
export interface UpdateDocumentsParams {
  dbClient: MongoClient;
  dbName: string;
  collectionName: string;
  filter: object;
  update: object;
}

// Interface for deleting documents from a collection
export interface DeleteDocumentsParams {
  dbClient: MongoClient;
  dbName: string;
  collectionName: string;
  filter: object;
}

// Interface for finding documents in a collection
export interface FindDocumentsParams {
  dbClient: MongoClient;
  dbName: string;
  collectionName: string;
  filter?: object;
}

// Interface for counting documents in a collection
export interface CountDocumentsParams extends FindDocumentsParams {}

// Interface for aggregating documents in a collection
export interface AggregateDocumentsParams {
  dbClient: MongoClient;
  dbName: string;
  collectionName: string;
  pipeline: object[];
}

// Interface for dropping a database
export interface DropDatabaseParams {
  dbClient: MongoClient;
  dbName: string;
}