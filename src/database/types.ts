
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

export type EnvType = 'production' | 'test' | 'development';

export interface VersionOperationParams {
    dbClient: MongoClient;
    projectName: string;
    serviceName: string;
    secretName: string;
    versionName: string;
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
    versionName: string;
    value: string;
}

export interface VersionOperationResponse {
    status: boolean;
    message: string;
    secret?: Secret | null;
    version?: Version;
    versions?: Version[];
}

export interface Version {
    versionName: string;
    value: string;
}

export interface Secret {
    _id?: ObjectId;
    secretName: string;
    envName: string;
    envType: EnvType;
    versions: Version[];
    updatedAt: Date;
    createdAt: Date;
    lastAccessAt: Date;
}

export interface SecretOperationParams {
    dbClient: MongoClient;
    projectName: string;
    serviceName: string;
    filter?: object;
    secretName?: string;
    newSecretName?: string;
    envName?: string;
    envType?: EnvType;
    versions?: Version[];
}

export interface SecretOperationResponse {
    status: boolean;
    message: string;
    secret?: Secret | null;
    secrets?: Secret[];
}
export interface Project {
    name: string;
    services?: string[];
}

export interface ProjectOperationParams {
    dbClient: MongoClient;
    projectName?: string;
    serviceName?: string;
    targetProjectName?: string; 
}

export interface ProjectOperationResponse {
    status: boolean;
    message: string;
    project?: Project;
    projects?: Project[];
}
export interface ServiceOperationParams {
    dbClient: MongoClient;
    projectName: string;
    serviceName?: string;
    oldServiceName?: string;
    newServiceName?: string;
}

export interface Service {
    serviceName: string;
    secrets: Secret[];
}

export interface ServiceOperationResponse {
    status: boolean;
    message: string;
    services?: string[];
    service?: Service; // Add this to include the service object in responses
    exists?: boolean;
}
