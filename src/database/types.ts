
import { MongoClient, ObjectId } from "mongodb";

export interface dbProjectOperationResponse {
    status: boolean;
    message: string;
    projectName?: string;
    serviceName?: string;
    projects?: string[];
}

export interface dbServiceOperationResponse {
    status: boolean;
    message: string;
    projectName: string;
    serviceName?: string;
    services?: string[];
    exists?: boolean;
} 

type EnvType = 'production' | 'test' | 'development';

export interface VersionOperationParams {
    dbClient: MongoClient;
    projectName: string;
    serviceName: string;
    secretName: string;
    version: string;
    value: string;
}

export interface AddVersionParams extends VersionOperationParams { }
export interface ListVersionParams extends VersionOperationParams { }
export interface UpdateVersionParams extends VersionOperationParams { }
export interface LatestVersionParams extends VersionOperationParams { }
export interface DeleteVersionParams extends VersionOperationParams { }
export interface RollBackVersionParams extends VersionOperationParams { }

export interface VersionOperationResponse {
    status: boolean;
    message: string;
    secret?: Secret | null;
    version?: Version;
    versions?: Version[];
}

export interface Version {
    version: string;
    value: string;
}

export interface Secret {
    _id: ObjectId;
    secretName: string;
    envName: string;
    envType: EnvType;
    version: Version[];
    updatedAt: Date;
    createdAt: Date;
    lastAccessAt: Date;
}