import { Db, MongoClient } from 'mongodb';

declare global {
  var mongoClient: MongoClient | any;
  var mongoDatabase: Db | null;
}