import { Db } from 'mongodb';
export interface InitializeMongoResponse {
    status: boolean;
    mongoDatabase: Db | null;
    message: string;
  }