// ./database/index.d.ts

import { Db } from "mongodb";
import {
  ProjectOperationParams,
  ProjectOperationResponse,
  ServiceOperationParams,
  ServiceOperationResponse,
  SecretOperationParams,
  SecretOperationResponse,
  VersionOperationParams,
  VersionOperationResponse
} from "./databaseTypes"; 

declare module "./projects" {
    interface Projects {
        getConnection(params: ProjectOperationParams): Db;
        exists(params: ProjectOperationParams): Promise<ProjectOperationResponse>;
        list(params: ProjectOperationParams): Promise<ProjectOperationResponse>;
        create(params: ProjectOperationParams): Promise<ProjectOperationResponse>;
        delete(params: ProjectOperationParams): Promise<ProjectOperationResponse>;
        copy(params: ProjectOperationParams): Promise<ProjectOperationResponse>;
    }
    const projects: Projects;
    export = projects;
}

declare module "./services" {
    interface Services {
        list(params: ServiceOperationParams): Promise<ServiceOperationResponse>;
        add(params: ServiceOperationParams): Promise<ServiceOperationResponse>;
        rename(params: ServiceOperationParams): Promise<ServiceOperationResponse>;
        remove(params: ServiceOperationParams): Promise<ServiceOperationResponse>;
        exists(params: ServiceOperationParams): Promise<ServiceOperationResponse>;
        getService(params: ServiceOperationParams): Promise<ServiceOperationResponse>;
    }
    const services: Services;
    export = services;
}

declare module "./secrets" {
    interface Secrets {
        add(params: SecretOperationParams): Promise<SecretOperationResponse>;
        delete(params: SecretOperationParams): Promise<SecretOperationResponse>;
        rename(params: SecretOperationParams): Promise<SecretOperationResponse>;
        list(params: SecretOperationParams): Promise<SecretOperationResponse>;
        find(params: SecretOperationParams): Promise<SecretOperationResponse>;
        findByName(params: SecretOperationParams): Promise<SecretOperationResponse>;
    }
    const secrets: Secrets;
    export = secrets;
}

declare module "./versions" {
    interface Versions {
        add(params: VersionOperationParams): Promise<VersionOperationResponse>;
        update(params: VersionOperationParams): Promise<VersionOperationResponse>;
        delete(params: VersionOperationParams): Promise<VersionOperationResponse>;
        rollback(params: VersionOperationParams): Promise<VersionOperationResponse>;
        list(params: VersionOperationParams): Promise<VersionOperationResponse>;
    }
    const versions: Versions;
    export = versions;
}
