import { Db } from "mongodb";
import { findServiceByName } from "./findServiceByName";

// Assuming findServiceByName is either in the same module or imported correctly

export const findSpecificKeyForService = async ({
    serviceName,
    keyType,
    dbConnection
  }: {
    serviceName: string,
    keyType: string,
    dbConnection: Db | any
  }) => {
    let status = false;
    let credential = null;
    let message = '';
  
    try {
      // First, attempt to find the service by name to handle case sensitivity
      const serviceResult = await findServiceByName({ serviceName, dbConnection });
  
      if (!serviceResult.status) {
        // Directly return if service was not found or if there was a hint for case sensitivity
        return serviceResult;
      }
  
      // Service found successfully, now look for the specific key
      const service = serviceResult.result.find((srv: any) => srv.name === serviceName); // Should always be true here
      const key = service.keys.find((key: { keyName: string; }) => key.keyName === keyType);
  
      if (key) {
        status = true;
        credential = key;
        message = `${keyType} key for service ${serviceName} retrieved successfully.`;
      } else {
        message = `${keyType} key for service '${serviceName}' not found.`;
      }
  
    } catch (error: any) {
      message = `Error: ${error.message}`;
    }
  
    return { status, credential, message };
  };
  