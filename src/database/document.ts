
import { MongoClient } from "mongodb";
import { databaseOperation } from "./databaseOperation";
import { FindDocumentParams, OperationResult } from "./types";

export const findAllDocuments = async (dbClient: MongoClient, dbName: string, collectionName: string): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const documents = await db.collection(collectionName).find({}).toArray();
        return { status: true, message: "Documents retrieved successfully.", data: documents };
    });

export const updateDocuments = async (dbClient: MongoClient, dbName: string, collectionName: string, filter: object, update: object): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).updateMany(filter, update);
        return { status: true, message: `Documents updated.`, data: result };
    });

export const deleteDocuments = async (dbClient: MongoClient, dbName: string, collectionName: string, filter: object): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const result = await db.collection(collectionName).deleteMany(filter);
        return { status: true, message: `Documents deleted.`, data: result };
    });

export const findDocuments = async (dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const documents = await db.collection(collectionName).find(filter).toArray();
        return { status: true, message: `Documents found.`, data: documents };
    });

export const countDocuments = async (dbClient: MongoClient, dbName: string, collectionName: string, filter: object = {}): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const count = await db.collection(collectionName).countDocuments(filter);
        return { status: true, message: `Documents counted.`, data: [{ count }] };
    });

export const aggregateDocuments = async (dbClient: MongoClient, dbName: string, collectionName: string, pipeline: object[]): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const documents = await db.collection(collectionName).aggregate(pipeline).toArray();
        return { status: true, message: `Documents aggregated.`, data: documents };
    });

export const findDocumentByName = async ({ dbClient, dbName, collectionName, documentName, }: FindDocumentParams): Promise<OperationResult> =>
    databaseOperation(dbClient, dbName, async (db) => {
        const document = await db.collection(collectionName).findOne({ name: documentName });
        return { status: !!document, message: document ? `Document found.` : `Document not found.`, data: document || null };
    });