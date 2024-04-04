
import {  ObjectId } from "mongodb";

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


