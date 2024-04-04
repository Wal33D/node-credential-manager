import { OperationResult } from "./types";

export async function performDbOperation(operation: () => Promise<OperationResult>): Promise<OperationResult> {
    try {
        return await operation();
    } catch (error: any) {
        return { status: false, message: error.message };
    }
}