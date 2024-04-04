import { MongoClient } from "mongodb";
import { OperationResult } from "./types";
import { performDbOperation } from "./performDbOperation";

export async function databaseOperation(dbClient: MongoClient, dbName: string, action: (db: any) => Promise<OperationResult>): Promise<OperationResult> {
    return performDbOperation(async () => await action(dbClient.db(dbName)));
}